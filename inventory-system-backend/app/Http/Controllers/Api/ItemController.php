<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Place;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
        
        if ($request->has('cupboard_id')) {
            $query->whereHas('place', function($q) use ($request) {
                $q->where('cupboard_id', $request->cupboard_id);
            });
        }
        
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%")
                  ->orWhere('serial_number', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }
        
        $sortField = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortField, $sortOrder);
        
        $items = $query->paginate($request->get('per_page', 15));
        
        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:items,code',
            'quantity' => 'required|integer|min:0',
            'serial_number' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'description' => 'nullable|string',
            'place_id' => 'required|exists:places,id',
            'status' => ['required', Rule::in(['in_store', 'borrowed', 'damaged', 'missing'])]
        ]);

        $item = DB::transaction(function () use ($request) {
            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('items', 'public');
            }

            $item = Item::create([
                'name' => $request->name,
                'code' => $request->code,
                'quantity' => $request->quantity,
                'serial_number' => $request->serial_number,
                'image' => $imagePath,
                'description' => $request->description,
                'place_id' => $request->place_id,
                'status' => $request->status,
                'created_by' => auth()->id()
            ]);

            AuditLog::log(
                auth()->user(),
                'item.created',
                $item,
                null,
                $item->load('place')->toArray()
            );

            return $item;
        });

        return response()->json([
            'success' => true,
            'message' => 'Item created successfully',
            'data' => $item->load(['place.cupboard', 'creator'])
        ], 201);
    }

    public function show($id)
    {
        $item = Item::with([
            'place.cupboard', 
            'creator',
            'borrowings' => function($q) {
                $q->latest()->limit(10);
            },
            'borrowings.borrowedBy'
        ])->findOrFail($id);
        
        $stats = [
            'total_borrowings' => $item->borrowings()->count(),
            'active_borrowings' => $item->borrowings()->where('status', 'borrowed')->count(),
            'total_quantity_borrowed' => $item->borrowings()->sum('quantity_borrowed'),
            'last_borrowed' => $item->borrowings()->where('status', 'borrowed')->latest()->first(),
            'is_low_stock' => $item->quantity <= 5,
            'location_path' => $item->place->cupboard->name . ' > ' . $item->place->name
        ];
        
        return response()->json([
            'success' => true,
            'data' => $item,
            'stats' => $stats
        ]);
    }

    public function update(Request $request, $id)
    {
        $item = Item::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => ['sometimes', 'string', Rule::unique('items')->ignore($item->id)],
            'quantity' => 'sometimes|integer|min:0',
            'serial_number' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'description' => 'nullable|string',
            'place_id' => 'sometimes|exists:places,id',
            'status' => ['sometimes', Rule::in(['in_store', 'borrowed', 'damaged', 'missing'])]
        ]);

        $oldData = $item->load('place')->toArray();
        
        DB::transaction(function () use ($request, $item, $oldData) {
            if ($request->hasFile('image')) {
                if ($item->image) {
                    Storage::disk('public')->delete($item->image);
                }
                $imagePath = $request->file('image')->store('items', 'public');
                $item->image = $imagePath;
            }
            
            $item->update($request->except(['image']));
            
            AuditLog::log(
                auth()->user(),
                'item.updated',
                $item,
                $oldData,
                $item->load('place')->toArray()
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully',
            'data' => $item->fresh(['place.cupboard', 'creator'])
        ]);
    }

    public function destroy($id)
    {
        $item = Item::findOrFail($id);
        
        if ($item->borrowings()->where('status', 'borrowed')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete item with active borrowings. Please return all copies first.'
            ], 422);
        }
        
        $oldData = $item->toArray();
        
        DB::transaction(function () use ($item, $oldData) {
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            
            AuditLog::log(
                auth()->user(),
                'item.deleted',
                $item,
                $oldData,
                null
            );
            
            $item->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Item deleted successfully'
        ]);
    }

    public function incrementQuantity(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|integer|min:1'
        ]);
        
        $item = Item::findOrFail($id);
        $oldQuantity = $item->quantity;
        
        DB::transaction(function () use ($request, $item, $oldQuantity) {
            $item->increment('quantity', $request->amount);
            
            if ($item->status === 'borrowed' && $item->quantity > 0) {
                $oldStatus = $item->status;
                $item->update(['status' => 'in_store']);
                
                AuditLog::log(
                    auth()->user(),
                    'status.changed',
                    $item,
                    ['status' => $oldStatus],
                    ['status' => 'in_store']
                );
            }
            
            AuditLog::log(
                auth()->user(),
                'quantity.incremented',
                $item,
                ['quantity' => $oldQuantity],
                ['quantity' => $item->quantity]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Quantity increased successfully',
            'data' => $item
        ]);
    }

    public function decrementQuantity(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|integer|min:1'
        ]);
        
        $item = Item::findOrFail($id);
        
        if ($item->quantity - $request->amount < 0) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient stock. Available: ' . $item->quantity
            ], 422);
        }
        
        $oldQuantity = $item->quantity;
        
        DB::transaction(function () use ($request, $item, $oldQuantity) {
            $item->decrement('quantity', $request->amount);
            
            if ($item->quantity === 0 && $item->status === 'in_store') {
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
                'quantity.decremented',
                $item,
                ['quantity' => $oldQuantity],
                ['quantity' => $item->quantity]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Quantity decreased successfully',
            'data' => $item
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => ['required', Rule::in(['in_store', 'borrowed', 'damaged', 'missing'])]
        ]);
        
        $item = Item::findOrFail($id);
        $oldStatus = $item->status;
        
        DB::transaction(function () use ($request, $item, $oldStatus) {
            $item->update(['status' => $request->status]);
            
            AuditLog::log(
                auth()->user(),
                'status.changed',
                $item,
                ['status' => $oldStatus],
                ['status' => $request->status]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
            'data' => $item
        ]);
    }

    public function byStatus($status)
    {
        $items = Item::where('status', $status)
            ->with(['place.cupboard'])
            ->latest()
            ->paginate(20);
            
        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    public function byPlace($placeId)
    {
        $place = Place::findOrFail($placeId);
        $items = $place->items()->with('creator')->latest()->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $items,
            'place' => $place
        ]);
    }

    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2'
        ]);
        
        $items = Item::where('name', 'like', "%{$request->query}%")
            ->orWhere('code', 'like', "%{$request->query}%")
            ->orWhere('serial_number', 'like', "%{$request->query}%")
            ->orWhere('description', 'like', "%{$request->query}%")
            ->with(['place.cupboard'])
            ->limit(50)
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $items,
            'count' => $items->count()
        ]);
    }

    public function lowStock($threshold = 5)
    {
        $items = Item::where('quantity', '<=', $threshold)
            ->where('status', 'in_store')
            ->with(['place.cupboard'])
            ->orderBy('quantity', 'asc')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $items,
            'threshold' => $threshold
        ]);
    }

    public function borrowHistory($id)
    {
        $item = Item::findOrFail($id);
        $borrowings = $item->borrowings()
            ->with(['borrowedBy', 'returnedBy'])
            ->latest()
            ->paginate(20);
            
        return response()->json([
            'success' => true,
            'data' => $borrowings,
            'item' => $item
        ]);
    }

    public function export(Request $request)
    {
        $items = Item::with(['place.cupboard'])->get();
        
        $csv = "ID,Name,Code,Quantity,Serial Number,Status,Location,Created At\n";
        foreach ($items as $item) {
            $location = $item->place->cupboard->name . ' > ' . $item->place->name;
            $csv .= "\"{$item->id}\",\"{$item->name}\",\"{$item->code}\",{$item->quantity},\"{$item->serial_number}\",";
            $csv .= "\"{$item->status}\",\"{$location}\",\"{$item->created_at}\"\n";
        }
        
        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="items-export.csv"');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:items,id'
        ]);

        $deletedCount = 0;
        $errors = [];

        foreach ($request->ids as $id) {
            $item = Item::find($id);
            
            if ($item->borrowings()->where('status', 'borrowed')->exists()) {
                $errors[] = "Item '{$item->name}' has active borrowings and cannot be deleted";
                continue;
            }
            
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            
            AuditLog::log(
                auth()->user(),
                'item.deleted',
                $item,
                $item->toArray(),
                null
            );
            
            $item->delete();
            $deletedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "Deleted {$deletedCount} items",
            'errors' => $errors
        ]);
    }
}