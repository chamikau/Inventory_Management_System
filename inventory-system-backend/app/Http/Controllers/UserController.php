<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);
        
        $users = User::with('creator')
            ->latest()
            ->paginate($request->get('per_page', 15));
        
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', User::class);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['admin', 'staff'])]
        ]);

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'created_by' => auth()->id()
            ]);

            AuditLog::log(
                auth()->user(),
                'user.created',
                $user,
                null,
                $user->toArray()
            );

            return $user;
        });

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    public function show(User $user)
    {
        $this->authorize('view', $user);
        
        return response()->json([
            'success' => true,
            'data' => $user->load('creator')
        ]);
    }

    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);
        
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'role' => ['sometimes', Rule::in(['admin', 'staff'])],
            'password' => 'sometimes|string|min:8'
        ]);

        $oldData = $user->toArray();
        
        DB::transaction(function () use ($request, $user, $oldData) {
            $updateData = $request->only(['name', 'email', 'role']);
            
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }
            
            $user->update($updateData);
            
            AuditLog::log(
                auth()->user(),
                'user.updated',
                $user,
                $oldData,
                $user->toArray()
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }

    public function destroy(User $user)
    {
        $this->authorize('delete', $user);
        
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account'
            ], 403);
        }
        
        $oldData = $user->toArray();
        
        DB::transaction(function () use ($user, $oldData) {
            AuditLog::log(
                auth()->user(),
                'user.deleted',
                $user,
                $oldData,
                null
            );
            
            $user->delete();
        });
        
        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }
}