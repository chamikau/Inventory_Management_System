<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Place extends Model
{
    public function cupboard()
    {
        return $this->belongsTo(Cupboard::class);
    }
}
