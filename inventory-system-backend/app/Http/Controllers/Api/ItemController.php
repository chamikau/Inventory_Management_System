<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Place;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::with(['place.cupboard', 'creator']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('place_id')) {
            $query->where('place_id', $request->place_id);
        }
        
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%")
                  ->orWhere('serial_number', 'like', "%{$request->search}%");
            });
        }
        
        $items = $query->latest()->paginate($request->get('per_page', 15));
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:items,code',
            'quantity' => 'required|integer|min:0',
            'serial_number' => 'nullable|string',
            'image' => 'nullable|string',
            'description' => 'nullable|string',
            'place_id' => 'required|exists:places,id',
            'status' => ['required', Rule::in(['in_store', 'borrowed', 'damaged', 'missing'])]
        ]);

        $data['created_by'] = auth()->id();
        
        $item = DB::transaction(function () use ($data) {
            $item = Item::create($data);
            
            AuditLog::log(auth()->user(), 'item.created', $item, null, $item->toArray());
            
            return $item;
        });

        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = Item::with(['place.cupboard', 'creator', 'borrowings' => function($q) {
            $q->latest()->limit(5);
        }])->findOrFail($id);
        
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = Item::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => ['sometimes', 'string', Rule::unique('items')->ignore($item->id)],
            'quantity' => 'sometimes|integer|min:0',
            'serial_number' => 'nullable|string',
            'image' => 'nullable|string',
            'description' => 'nullable|string',
            'place_id' => 'sometimes|exists:places,id',
            'status' => ['sometimes', Rule::in(['in_store', 'borrowed', 'damaged', 'missing'])]
        ]);

        $oldData = $item->toArray();
        
        DB::transaction(function () use ($data, $item, $oldData) {
            $item->update($data);
            
            AuditLog::log(auth()->user(), 'item.updated', $item, $oldData, $item->toArray());
        });

        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = Item::findOrFail($id);
        
        if ($item->activeBorrowings()->exists()) {
            return response()->json([
                'message' => 'Cannot delete item with active borrowings'
            ], 422);
        }
        
        $oldData = $item->toArray();
        
        DB::transaction(function () use ($item, $oldData) {
            AuditLog::log(auth()->user(), 'item.deleted', $item, $oldData, null);
            $item->delete();
        });

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function incrementQuantity(Request $request, $id)
    {
        $request->validate(['amount' => 'required|integer|min:1']);
        
        $item = Item::findOrFail($id);
        $item->incrementQuantity($request->amount, auth()->user());
        
        return response()->json([
            'message' => 'Quantity increased successfully',
            'item' => $item
        ]);
    }

    public function decrementQuantity(Request $request, $id)
    {
        $request->validate(['amount' => 'required|integer|min:1']);
        
        $item = Item::findOrFail($id);
        
        try {
            $item->decrementQuantity($request->amount, auth()->user());
            return response()->json([
                'message' => 'Quantity decreased successfully',
                'item' => $item
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => ['required', Rule::in(['in_store', 'borrowed', 'damaged', 'missing'])]
        ]);
        
        $item = Item::findOrFail($id);
        $item->updateStatus($request->status, auth()->user());
        
        return response()->json([
            'message' => 'Status updated successfully',
            'item' => $item
        ]);
    }

    public function byStatus($status)
    {
        $items = Item::where('status', $status)->with('place')->get();
        return response()->json($items);
    }

    public function byPlace($placeId)
    {
        $place = Place::findOrFail($placeId);
        $items = $place->items()->with('place')->get();
        return response()->json($items);
    }

    public function search(Request $request)
    {
        $request->validate(['query' => 'required|string|min:2']);
        
        $items = Item::where('name', 'like', "%{$request->query}%")
            ->orWhere('code', 'like', "%{$request->query}%")
            ->orWhere('serial_number', 'like', "%{$request->query}%")
            ->with('place')
            ->get();
            
        return response()->json($items);
    }

    public function lowStock($threshold = 5)
    {
        $items = Item::where('quantity', '<=', $threshold)
            ->where('status', 'in_store')
            ->with('place')
            ->get();
            
        return response()->json($items);
    }

    public function borrowHistory($id)
    {
        $item = Item::findOrFail($id);
        $borrowings = $item->borrowings()->with('borrowedBy')->latest()->paginate(20);
        return response()->json($borrowings);
    }
}