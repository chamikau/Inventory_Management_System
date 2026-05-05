<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\User;
use App\Models\Cupboard;
use App\Models\Place;
use App\Models\Borrowing;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        $stats = [
            'total_items' => Item::count(),
            'total_quantity' => Item::sum('quantity'),
            'total_cupboards' => Cupboard::count(),
            'total_places' => Place::count(),
            'total_users' => User::count(),
            'items_by_status' => [
                'in_store' => Item::where('status', 'in_store')->count(),
                'borrowed' => Item::where('status', 'borrowed')->count(),
                'damaged' => Item::where('status', 'damaged')->count(),
                'missing' => Item::where('status', 'missing')->count(),
            ],
            'active_borrowings' => Borrowing::where('status', 'borrowed')->count(),
            'recent_activities' => AuditLog::with('user')->latest()->limit(10)->get(),
            'recent_borrowings' => Borrowing::with('item', 'borrowedBy')
                ->latest()
                ->limit(10)
                ->get(),
            'low_stock_items' => Item::where('quantity', '<=', 5)
                ->where('status', 'in_store')
                ->with('place')
                ->limit(5)
                ->get()
        ];
        
        return response()->json($stats);
    }
}