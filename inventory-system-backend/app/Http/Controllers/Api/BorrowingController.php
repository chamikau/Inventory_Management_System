<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Borrowing;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BorrowingController extends Controller
{
    public function index(Request $request)
    {
        $query = Borrowing::with(['item.place', 'borrowedBy', 'returnedBy']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }
        
        $borrowings = $query->latest()->paginate($request->get('per_page', 15));
        return response()->json($borrowings);
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
            return response()->json(['message' => 'Insufficient stock'], 422);
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

            $item->decrementQuantity($request->quantity_borrowed, auth()->user());
            
            if ($item->quantity === 0) {
                $item->updateStatus('borrowed', auth()->user());
            }

            AuditLog::log(auth()->user(), 'item.borrowed', $borrowing, null, $borrowing->toArray());
            
            return $borrowing;
        });

        return response()->json($borrowing, 201);
    }

    public function returnItem($id)
    {
        $borrowing = Borrowing::findOrFail($id);
        
        if ($borrowing->status === 'returned') {
            return response()->json(['message' => 'Item already returned'], 422);
        }

        DB::transaction(function () use ($borrowing) {
            $borrowing->update([
                'actual_return_date' => now(),
                'status' => 'returned',
                'returned_by' => auth()->id()
            ]);

            $borrowing->item->incrementQuantity($borrowing->quantity_borrowed, auth()->user());
            
            if ($borrowing->item->status === 'borrowed') {
                $borrowing->item->updateStatus('in_store', auth()->user());
            }

            AuditLog::log(auth()->user(), 'item.returned', $borrowing, null, $borrowing->toArray());
        });

        return response()->json(['message' => 'Item returned successfully', 'borrowing' => $borrowing]);
    }

    public function show($id)
    {
        $borrowing = Borrowing::with(['item.place.cupboard', 'borrowedBy', 'returnedBy'])->findOrFail($id);
        return response()->json($borrowing);
    }

    public function destroy($id)
    {
        $borrowing = Borrowing::findOrFail($id);
        
        if ($borrowing->status === 'borrowed') {
            return response()->json(['message' => 'Cannot delete active borrowing'], 422);
        }
        
        $borrowing->delete();
        
        return response()->json(['message' => 'Borrowing record deleted successfully']);
    }

    public function activeBorrowings()
    {
        $borrowings = Borrowing::with(['item', 'borrowedBy'])
            ->where('status', 'borrowed')
            ->get();
            
        return response()->json($borrowings);
    }

    public function overdueBorrowings()
    {
        $borrowings = Borrowing::with(['item', 'borrowedBy'])
            ->where('status', 'borrowed')
            ->where('expected_return_date', '<', now())
            ->get();
            
        return response()->json($borrowings);
    }

    public function byBorrower($borrowerName)
    {
        $borrowings = Borrowing::with(['item'])
            ->where('borrower_name', 'like', "%{$borrowerName}%")
            ->latest()
            ->paginate(20);
            
        return response()->json($borrowings);
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
            
        return response()->json($borrowings);
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
            'most_borrowed_items' => Borrowing::selectRaw('item_id, COUNT(*) as count')
                ->with('item')
                ->groupBy('item_id')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get()
        ];
        
        return response()->json($stats);
    }
}