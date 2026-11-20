<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LookupController;
use App\Http\Controllers\MachineController;
use App\Http\Controllers\OperatorController;
use App\Http\Controllers\ProductionRecordController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TelemetryController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/lookups', LookupController::class);

    // Monitoring
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Administrator + Operator
    Route::get('/machines', [MachineController::class, 'index']);
    Route::get('/production-records', [ProductionRecordController::class, 'index']);
    Route::post('/production-records', [ProductionRecordController::class, 'store']);
    Route::get('/reports', [ReportController::class, 'index']);
    Route::get('/reports/export', [ReportController::class, 'export']);

    // Administrator only
    Route::middleware('role:administrator')->group(function () {
        Route::post('/machines', [MachineController::class, 'store']);
        Route::put('/machines/{machine}', [MachineController::class, 'update']);
        Route::delete('/machines/{machine}', [MachineController::class, 'destroy']);
        Route::post('/machines/{machine}/telemetry', [TelemetryController::class, 'store']);

        Route::apiResource('operators', OperatorController::class)->except(['show']);

        Route::put('/production-records/{productionRecord}', [ProductionRecordController::class, 'update']);
        Route::delete('/production-records/{productionRecord}', [ProductionRecordController::class, 'destroy']);
    });
});
