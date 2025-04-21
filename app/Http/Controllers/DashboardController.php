<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $folderId = $request->query('folderId');
        return Inertia::render('dashboard', [
            'folderId' => $folderId,
        ]);
    }
}
