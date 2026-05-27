<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Place extends Model
{
    protected $fillable = [
        'name',
        'cupboard_id',
        'shelf_number',
        'description'
    ];

    public function cupboard()
    {
        return $this->belongsTo(Cupboard::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function getFullLocationAttribute()
    {
        return $this->cupboard->name . ' > ' . $this->name;
    }

    public function getDisplayNameAttribute()
    {
        $shelf = $this->shelf_number ? " ({$this->shelf_number})" : "";
        return $this->name . $shelf;
    }

    public function getItemsCountAttribute()
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