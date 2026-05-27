<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Borrowing extends Model
{
    protected $table = 'borrowings';
    
    protected $fillable = [
        'item_id',
        'borrower_name',
        'contact_details',
        'quantity_borrowed',
        'borrow_date',
        'expected_return_date',
        'actual_return_date',
        'status',
        'borrowed_by',
        'returned_by'
    ];

    protected $casts = [
        'borrow_date' => 'date',
        'expected_return_date' => 'date',
        'actual_return_date' => 'date',
        'quantity_borrowed' => 'integer',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function borrowedBy()
    {
        return $this->belongsTo(User::class, 'borrowed_by');
    }

    public function returnedBy()
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    public function getIsOverdueAttribute()
    {
        return $this->status === 'borrowed' && 
               $this->expected_return_date < now()->startOfDay();
    }

    public function getDaysOverdueAttribute()
    {
        if (!$this->getIsOverdueAttribute()) {
            return 0;
        }
        return now()->diffInDays($this->expected_return_date);
    }

    public function scopeBorrowed($query)
    {
        return $query->where('status', 'borrowed');
    }

    public function scopeReturned($query)
    {
        return $query->where('status', 'returned');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'borrowed')
                     ->where('expected_return_date', '<', now());
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('borrow_date', [$startDate, $endDate]);
    }
}