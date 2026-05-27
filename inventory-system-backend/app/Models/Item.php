<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Item extends Model
{
    protected $fillable = [
        'name',
        'code',
        'quantity',
        'serial_number',
        'image',
        'description',
        'place_id',
        'status',
        'created_by'
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function place()
    {
        return $this->belongsTo(Place::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function borrowings()
    {
        return $this->hasMany(Borrowing::class);
    }

    public function activeBorrowings()
    {
        return $this->hasMany(Borrowing::class)->where('status', 'borrowed');
    }

    public function incrementQuantity(int $amount, ?User $actor = null): void
    {
        DB::transaction(function () use ($amount, $actor) {
            $old = $this->quantity;
            $this->increment('quantity', $amount);
            $this->refresh();
            
            AuditLog::log(
                $actor ?? auth()->user(),
                'quantity.incremented',
                $this,
                ['quantity' => $old],
                ['quantity' => $this->quantity]
            );
        });
    }

    public function decrementQuantity(int $amount, ?User $actor = null): void
    {
        if ($this->quantity - $amount < 0) {
            throw new \Exception('Insufficient stock. Available: ' . $this->quantity);
        }
        
        DB::transaction(function () use ($amount, $actor) {
            $old = $this->quantity;
            $this->decrement('quantity', $amount);
            $this->refresh();
            
            AuditLog::log(
                $actor ?? auth()->user(),
                'quantity.decremented',
                $this,
                ['quantity' => $old],
                ['quantity' => $this->quantity]
            );
        });
    }

    public function isAvailable()
    {
        return $this->status === 'in_store' && $this->quantity > 0;
    }

    public function isBorrowed()
    {
        return $this->status === 'borrowed';
    }

    public function isDamaged()
    {
        return $this->status === 'damaged';
    }

    public function isMissing()
    {
        return $this->status === 'missing';
    }

    public function updateStatus(string $newStatus, ?User $actor = null): void
    {
        $oldStatus = $this->status;
        
        DB::transaction(function () use ($newStatus, $oldStatus, $actor) {
            $this->update(['status' => $newStatus]);
            
            AuditLog::log(
                $actor ?? auth()->user(),
                'status.changed',
                $this,
                ['status' => $oldStatus],
                ['status' => $newStatus]
            );
        });
    }

    public function scopeInStore($query)
    {
        return $query->where('status', 'in_store');
    }

    public function scopeBorrowed($query)
    {
        return $query->where('status', 'borrowed');
    }

    public function scopeDamaged($query)
    {
        return $query->where('status', 'damaged');
    }

    public function scopeMissing($query)
    {
        return $query->where('status', 'missing');
    }

    public function scopeLowStock($query, $threshold = 5)
    {
        return $query->where('quantity', '<=', $threshold);
    }
}