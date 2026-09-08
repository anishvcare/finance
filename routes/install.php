<?php

use App\Http\Controllers\Install\InstallController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web'])->prefix('install')->group(function () {
    Route::get('/', [InstallController::class, 'index']);
    Route::post('/check-requirements', [InstallController::class, 'checkRequirements']);
    Route::post('/check-permissions', [InstallController::class, 'checkPermissions']);
    Route::post('/test-database', [InstallController::class, 'testDatabase']);
    Route::post('/configure-app', [InstallController::class, 'configureApp']);
    Route::post('/run-migration', [InstallController::class, 'runMigration']);
    Route::post('/run-seeder', [InstallController::class, 'runSeeder']);
    Route::post('/create-admin', [InstallController::class, 'createAdmin']);
    Route::post('/finalize', [InstallController::class, 'finalize']);
});
