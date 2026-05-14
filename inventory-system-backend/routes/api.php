<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CupboardController;
use App\Http\Controllers\Api\PlaceController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\BorrowingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AuditLogController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    
    Route::get('/me', [AuthController::class, 'me']);
    
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
    
    Route::apiResource('items', ItemController::class);
    Route::apiResource('cupboards', CupboardController::class);
    Route::apiResource('places', PlaceController::class);

    Route::post('/items/{item}/borrow', [BorrowingController::class, 'borrow']);
    Route::post('/borrowings/{borrowing}/return', [BorrowingController::class, 'returnItem']);
    Route::get('/borrowings/active/current', [BorrowingController::class, 'activeBorrowings']);
    Route::get('/borrowings/overdue', [BorrowingController::class, 'overdueBorrowings']);
    Route::get('/borrowings/by-borrower/{borrowerName}', [BorrowingController::class, 'byBorrower']);
    Route::get('/borrowings/stats', [BorrowingController::class, 'statistics']);
    Route::get('/items/{item}/borrow-history', [BorrowingController::class, 'itemHistory']);
    
    Route::apiResource('borrowings', BorrowingController::class)->except(['create', 'edit']);

    Route::post('/items/{item}/increment-quantity', [ItemController::class, 'incrementQuantity']);
    Route::post('/items/{item}/decrement-quantity', [ItemController::class, 'decrementQuantity']);
    Route::patch('/items/{item}/status', [ItemController::class, 'updateStatus']);
    Route::get('/items/by-status/{status}', [ItemController::class, 'byStatus']);
    Route::get('/items/by-place/{place}', [ItemController::class, 'byPlace']);
    Route::get('/items/search', [ItemController::class, 'search']);
    Route::get('/items/low-stock/{threshold?}', [ItemController::class, 'lowStock']);
    Route::get('/items/{item}/borrow-history', [ItemController::class, 'borrowHistory']);
    Route::get('/items/export/csv', [ItemController::class, 'export']);
    Route::post('/items/bulk-delete', [ItemController::class, 'bulkDelete']);
    
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/statistics', [AuditLogController::class, 'statistics']);
    Route::get('/audit-logs/{id}', [AuditLogController::class, 'show']);
    Route::get('/audit-logs/entity/{entityType}/{entityId}', [AuditLogController::class, 'forEntity']);
    Route::get('/audit-logs/action/{action}', [AuditLogController::class, 'byAction']);
    Route::get('/audit-logs/user/{userId}', [AuditLogController::class, 'byUser']);
    Route::get('/audit-logs/export/csv', [AuditLogController::class, 'export']);
    Route::delete('/audit-logs/clear-old', [AuditLogController::class, 'clearOld']);
    
});