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
            'old_value' => $oldValue ? json_encode($oldValue) : null,
            'new_value' => $newValue ? json_encode($newValue) : null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    public function scopeForEntity($query, $entity)
    {
        return $query->where('entity_type', get_class($entity))
                     ->where('entity_id', $entity->id);
    }

    public function scopeForAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecent($query, $limit = 50)
    {
        return $query->latest()->limit($limit);
    }

    public function getReadableActionAttribute()
    {
        $actions = [
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
        ];
        
        return $actions[$this->action] ?? ucfirst(str_replace('.', ' ', $this->action));
    }
}