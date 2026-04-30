<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cupboard extends Model
{
    protected $fillable = [
        'name',
        'location',
        'description',
        'created_by'
    ];

    public function places()
    {
        return $this->hasMany(Place::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasManyThrough(Item::class, Place::class);
    }

    public function getTotalItemsCountAttribute()
    {
        return $this->items()->count();
    }

    public function getTotalQuantityAttribute()
    {
        return $this->items()->sum('quantity');
    }

    public function hasItems()
    {
        return $this->items()->exists();
    }
}