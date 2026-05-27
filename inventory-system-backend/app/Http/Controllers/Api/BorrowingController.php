<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Borrowing;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BorrowingController extends Controller
{

    public function index(Request $request)
    {
        $query = Borrowing::with(['item.place.cupboard', 'borrowedBy', 'returnedBy']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }
        
        if ($request->has('borrower_name')) {
            $query->where('borrower_name', 'like', "%{$request->borrower_name}%");
        }
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('borrow_date', [$request->start_date, $request->end_date]);
        }
        
        $borrowings = $query->latest()->paginate($request->get('per_page', 15));
        
        return response()->json([
            'success' => true,
            'data' => $borrowings
        ]);
    }

    public function borrow(Request $request, $itemId)
    {
        $item = Item::findOrFail($itemId);
        
        $request->validate([
            'borrower_name' => 'required|string|max:255',
            'contact_details' => 'required|string|max:500',
            'quantity_borrowed' => 'required|integer|min:1|max:' . $item->quantity,
            'expected_return_date' => 'required|date|after:today'
        ]);

        if ($item->quantity < $request->quantity_borrowed) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient stock. Available: ' . $item->quantity
            ], 422);
        }

        $borrowing = DB::transaction(function () use ($request, $item) {
            $borrowing = Borrowing::create([
                'item_id' => $item->id,
                'borrower_name' => $request->borrower_name,
                'contact_details' => $request->contact_details,
                'quantity_borrowed' => $request->quantity_borrowed,
                'borrow_date' => now(),
                'expected_return_date' => $request->expected_return_date,
                'borrowed_by' => auth()->id(),
                'status' => 'borrowed'
            ]);

            $oldQuantity = $item->quantity;
            $item->decrement('quantity', $request->quantity_borrowed);
            
            if ($item->quantity === 0) {
                $oldStatus = $item->status;
                $item->update(['status' => 'borrowed']);
                
                AuditLog::log(
                    auth()->user(),
                    'status.changed',
                    $item,
                    ['status' => $oldStatus],
                    ['status' => 'borrowed']
                );
            }

            AuditLog::log(
                auth()->user(),
                'item.borrowed',
                $borrowing,
                null,
                [
                    'item_code' => $item->code,
                    'item_name' => $item->name,
                    'quantity' => $request->quantity_borrowed,
                    'borrower' => $request->borrower_name,
                    'expected_return' => $request->expected_return_date
                ]
            );
            
            return $borrowing;
        });

        return response()->json([
            'success' => true,
            'message' => 'Item borrowed successfully',
            'data' => $borrowing->load(['item', 'borrowedBy'])
        ], 201);
    }

    public function returnItem($id)
    {
        $borrowing = Borrowing::findOrFail($id);
        
        if ($borrowing->status === 'returned') {
            return response()->json([
                'success' => false,
                'message' => 'Item already returned'
            ], 422);
        }

        DB::transaction(function () use ($borrowing) {
            $oldData = $borrowing->toArray();
            
            $borrowing->update([
                'actual_return_date' => now(),
                'status' => 'returned',
                'returned_by' => auth()->id()
            ]);

            $item = $borrowing->item;
            $oldItemQuantity = $item->quantity;
            $item->increment('quantity', $borrowing->quantity_borrowed);
            
            if ($item->status === 'borrowed' && $item->quantity > 0) {
                $oldItemStatus = $item->status;
                $item->update(['status' => 'in_store']);
                
                AuditLog::log(
                    auth()->user(),
                    'status.changed',
                    $item,
                    ['status' => $oldItemStatus],
                    ['status' => 'in_store']
                );
            }

            AuditLog::log(
                auth()->user(),
                'item.returned',
                $borrowing,
                $oldData,
                [
                    'item_code' => $item->code,
                    'item_name' => $item->name,
                    'quantity' => $borrowing->quantity_borrowed,
                    'borrower' => $borrowing->borrower_name,
                    'actual_return' => now()->toDateString()
                ]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Item returned successfully',
            'data' => $borrowing->fresh(['item', 'returnedBy'])
        ]);
    }

    public function show($id)
    {
        $borrowing = Borrowing::with(['item.place.cupboard', 'borrowedBy', 'returnedBy'])->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $borrowing
        ]);
    }

    public function destroy($id)
    {
        $borrowing = Borrowing::findOrFail($id);
        
        if ($borrowing->status === 'borrowed') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete active borrowing. Please return the item first.'
            ], 422);
        }
        
        $oldData = $borrowing->toArray();
        
        AuditLog::log(
            auth()->user(),
            'borrowing.deleted',
            $borrowing,
            $oldData,
            null
        );
        
        $borrowing->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Borrowing record deleted successfully'
        ]);
    }

    public function activeBorrowings()
    {
        $borrowings = Borrowing::with(['item', 'borrowedBy'])
            ->where('status', 'borrowed')
            ->orderBy('expected_return_date')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $borrowings
        ]);
    }

    public function overdueBorrowings()
    {
        $borrowings = Borrowing::with(['item', 'borrowedBy'])
            ->where('status', 'borrowed')
            ->where('expected_return_date', '<', now())
            ->orderBy('expected_return_date')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $borrowings
        ]);
    }

    public function byBorrower($borrowerName)
    {
        $borrowings = Borrowing::with(['item'])
            ->where('borrower_name', 'like', "%{$borrowerName}%")
            ->latest()
            ->paginate(20);
            
        return response()->json([
            'success' => true,
            'data' => $borrowings
        ]);
    }

    public function byDateRange(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);
        
        $borrowings = Borrowing::with(['item'])
            ->whereBetween('borrow_date', [$request->start_date, $request->end_date])
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $borrowings
        ]);
    }

    public function statistics()
    {
        $stats = [
            'total_borrowings' => Borrowing::count(),
            'active_borrowings' => Borrowing::where('status', 'borrowed')->count(),
            'returned_borrowings' => Borrowing::where('status', 'returned')->count(),
            'overdue_borrowings' => Borrowing::where('status', 'borrowed')
                ->where('expected_return_date', '<', now())
                ->count(),
            'total_items_borrowed' => Borrowing::sum('quantity_borrowed'),
            'most_borrowed_items' => Borrowing::selectRaw('item_id, SUM(quantity_borrowed) as total_borrowed')
                ->with('item')
                ->groupBy('item_id')
                ->orderBy('total_borrowed', 'desc')
                ->limit(5)
                ->get(),
            'top_borrowers' => Borrowing::selectRaw('borrower_name, COUNT(*) as borrow_count, SUM(quantity_borrowed) as total_items')
                ->groupBy('borrower_name')
                ->orderBy('borrow_count', 'desc')
                ->limit(5)
                ->get(),
            'monthly_borrowings' => Borrowing::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
                ->groupBy('month')
                ->orderBy('month', 'desc')
                ->limit(6)
                ->get()
        ];
        
        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    public function itemHistory($itemId)
    {
        $item = Item::findOrFail($itemId);
        $borrowings = $item->borrowings()->with('borrowedBy')->latest()->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $borrowings
        ]);
    }
}