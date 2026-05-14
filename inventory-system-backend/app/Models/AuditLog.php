<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'old_value',
        'new_value',
        'ip_address',
        'user_agent'
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function log($user, $action, $entity = null, $oldValue = null, $newValue = null)
    {
        if (!$user) {
            $user = auth()->user();
        }
        
        if (!$user) {
            return null;
        }

        return self::create([
            'user_id' => $user->id,
            'action' => $action,
            'entity_type' => $entity ? get_class($entity) : null,
            'entity_id' => $entity ? $entity->id : null,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    public function getReadableActionAttribute()
    {
        $actions = [
            'user.login' => 'User Login',
            'user.logout' => 'User Logout',
            'user.created' => 'User Created',
            'user.updated' => 'User Updated',
            'user.deleted' => 'User Deleted',
            'cupboard.created' => 'Cupboard Created',
            'cupboard.updated' => 'Cupboard Updated',
            'cupboard.deleted' => 'Cupboard Deleted',
            'place.created' => 'Place Created',
            'place.updated' => 'Place Updated',
            'place.deleted' => 'Place Deleted',
            'item.created' => 'Item Created',
            'item.updated' => 'Item Updated',
            'item.deleted' => 'Item Deleted',
            'quantity.incremented' => 'Quantity Increased',
            'quantity.decremented' => 'Quantity Decreased',
            'status.changed' => 'Status Changed',
            'item.borrowed' => 'Item Borrowed',
            'item.returned' => 'Item Returned',
            'borrowing.deleted' => 'Borrowing Record Deleted',
        ];
        
        return $actions[$this->action] ?? ucfirst(str_replace('.', ' ', $this->action));
    }

    public function getEntityTypeNameAttribute()
    {
        $types = [
            'App\Models\User' => 'User',
            'App\Models\Cupboard' => 'Cupboard',
            'App\Models\Place' => 'Place',
            'App\Models\Item' => 'Item',
            'App\Models\Borrowing' => 'Borrowing',
        ];
        
        return $types[$this->entity_type] ?? 'Unknown';
    }

    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('created_at', now()->month);
    }
}