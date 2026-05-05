<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Place;
use App\Models\Cupboard;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlaceController extends Controller
{
    public function index(Request $request)
    {
        $query = Place::with('cupboard');
        
        if ($request->has('cupboard_id')) {
            $query->where('cupboard_id', $request->cupboard_id);
        }
        
        $places = $query->latest()->get();
        return response()->json($places);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'cupboard_id' => 'required|exists:cupboards,id',
            'shelf_number' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $place = Place::create($data);

        AuditLog::log(auth()->user(), 'place.created', $place, null, $place->toArray());

        return response()->json($place, 201);
    }

    public function show($id)
    {
        $place = Place::with(['cupboard', 'items'])->findOrFail($id);
        return response()->json($place);
    }

    public function update(Request $request, $id)
    {
        $place = Place::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'cupboard_id' => 'sometimes|exists:cupboards,id',
            'shelf_number' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $oldData = $place->toArray();
        $place->update($data);

        AuditLog::log(auth()->user(), 'place.updated', $place, $oldData, $place->toArray());

        return response()->json($place);
    }

    public function destroy($id)
    {
        $place = Place::findOrFail($id);
        
        if ($place->items()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete place that contains items'
            ], 422);
        }
        
        $oldData = $place->toArray();
        
        AuditLog::log(auth()->user(), 'place.deleted', $place, $oldData, null);
        
        $place->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function byCupboard($cupboardId)
    {
        $cupboard = Cupboard::findOrFail($cupboardId);
        $places = $cupboard->places()->with('items')->get();
        return response()->json($places);
    }

    public function items($id)
    {
        $place = Place::findOrFail($id);
        $items = $place->items()->get();
        return response()->json($items);
    }
}