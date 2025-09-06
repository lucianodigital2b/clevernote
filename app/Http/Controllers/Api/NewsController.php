<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\QueryException;

class NewsController extends Controller
{
    /**
     * Get unread news for the authenticated user
     */
    public function getUnreadNews(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $unreadNews = News::active()
            ->published()
            ->unreadByUser($user)
            ->orderedByPriority()
            ->first(); // Get only the highest priority unread news

        if (!$unreadNews) {
            return response()->json(['news' => null]);
        }

        return response()->json([
            'news' => [
                'id' => $unreadNews->id,
                'title' => $unreadNews->title,
                'content' => $unreadNews->content,
                'featured_image' => $unreadNews->featured_image,
                'published_at' => $unreadNews->published_at,
                'priority' => $unreadNews->priority
            ]
        ]);
    }

    /**
     * Get paginated news for the authenticated user
     */
    public function getPaginatedNews(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $perPage = $request->get('per_page', 6);
        $page = $request->get('page', 1);

        $news = News::active()
            ->published()
            ->with(['viewedByUsers' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }])
            ->orderBy('priority', 'desc')
            ->orderBy('published_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        $newsData = $news->map(function ($newsItem) use ($user) {
            return [
                'id' => $newsItem->id,
                'title' => $newsItem->title,
                'content' => $newsItem->content,
                'featured_image' => $newsItem->featured_image,
                'published_at' => $newsItem->published_at,
                'priority' => $newsItem->priority,
                'is_viewed' => $newsItem->hasBeenViewedBy($user)
            ];
        });

        return response()->json([
            'data' => $newsData,
            'current_page' => $news->currentPage(),
            'last_page' => $news->lastPage(),
            'per_page' => $news->perPage(),
            'total' => $news->total(),
            'has_more' => $news->hasMorePages()
        ]);
    }

    /**
     * Mark news as viewed by the authenticated user
     */
    public function markAsViewed(Request $request, $newsId): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $news = News::find($newsId);
        
        if (!$news) {
            return response()->json(['error' => 'News not found'], 404);
        }

        // If the user has already viewed this news, return success idempotently
        if ($news && $news->hasBeenViewedBy($user)) {
            return response()->json(['success' => true]);
        }

        try {
            $news->markAsViewedBy($user);
        } catch (QueryException $e) {
            // Handle race-condition duplicate insert as success (idempotent endpoint)
            if ($e->getCode() === '23000') { // Integrity constraint violation (e.g., duplicate entry)
                return response()->json(['success' => true]);
            }
            throw $e;
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get all news (for admin purposes)
     */
    public function index(): JsonResponse
    {
        $news = News::orderedByPriority()->get();
        
        return response()->json(['news' => $news]);
    }

    /**
     * Store a new news item (for admin purposes)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'featured_image' => 'nullable|string',
            'is_active' => 'boolean',
            'published_at' => 'nullable|date',
            'priority' => 'integer|min:0'
        ]);

        $news = News::create($validated);

        return response()->json(['news' => $news], 201);
    }

    /**
     * Update a news item (for admin purposes)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $news = News::find($id);
        
        if (!$news) {
            return response()->json(['error' => 'News not found'], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'featured_image' => 'nullable|string',
            'is_active' => 'boolean',
            'published_at' => 'nullable|date',
            'priority' => 'integer|min:0'
        ]);

        $news->update($validated);

        return response()->json(['news' => $news]);
    }

    /**
     * Delete a news item (for admin purposes)
     */
    public function destroy($id): JsonResponse
    {
        $news = News::find($id);
        
        if (!$news) {
            return response()->json(['error' => 'News not found'], 404);
        }

        $news->delete();

        return response()->json(['success' => true]);
    }
}
