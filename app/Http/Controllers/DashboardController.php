<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $folderId = $request->query('folderId');
        $showUpgrade = $request->query('showUpgrade');
        return Inertia::render('dashboard', [
            'folderId' => $folderId,
            'showUpgrade' => $showUpgrade === 'true',
        ]);
    }
}
