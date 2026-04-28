<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cupboard;
use Illuminate\Http\Request;

class CupboardController extends Controller
{
    public function index()
    {
        return Cupboard::latest()->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $cupboard = Cupboard::create($data);

        return response()->json($cupboard, 201);
    }

    public function show($id)
    {
        return Cupboard::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $cupboard = Cupboard::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $cupboard->update($data);

        return response()->json($cupboard);
    }

    public function destroy($id)
    {
        Cupboard::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
