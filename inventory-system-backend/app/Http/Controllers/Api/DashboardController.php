<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Borrowing;
use App\Models\Cupboard;
use App\Models\Place;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $itemsByStatus = [
            'in_store' => Item::where('status', 'available')->count(), 
            'borrowed' => Item::where('status', 'borrowed')->count(),
            'damaged' => Item::where('status', 'damaged')->count(),
            'missing' => Item::where('status', 'missing')->count(),
        ];

        $data = [
            'total_items' => Item::count(),
            'total_cupboards' => Cupboard::count(),
            'total_places' => Place::count(),
            'active_borrowings' => Borrowing::borrowed()->count(),
            'items_by_status' => $itemsByStatus,
        ];

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}