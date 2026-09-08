<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('api/admin')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'dashboard']);
    Route::get('/users', [AdminDashboardController::class, 'users']);
    Route::post('/users/{user}/suspend', [AdminDashboardController::class, 'suspendUser']);
    Route::post('/users/{user}/activate', [AdminDashboardController::class, 'activateUser']);
    Route::get('/plans', [AdminDashboardController::class, 'plans']);
    Route::put('/plans/{plan}', [AdminDashboardController::class, 'updatePlan']);
    Route::get('/health', [AdminDashboardController::class, 'healthCheck']);
});
