<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{

        protected $policies = [
        User::class => UserPolicy::class,
    ];
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('access-admin', function (User $user) {
            return $user->role === 'admin';
        });

        Gate::define('access-staff', function (User $user) {
            return $user->role === 'staff';
        });
    }
}
