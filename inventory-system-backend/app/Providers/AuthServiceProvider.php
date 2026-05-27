<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        User::class => UserPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Simple role gates
        Gate::define('admin', function (User $user) {
            return $user->role === 'admin';
        });

        Gate::define('staff', function (User $user) {
            return $user->role === 'staff';
        });
    }
}