<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\ProductionRecord;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $counts = Machine::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $today = now()->toDateString();

        $production = ProductionRecord::query()
            ->where('production_date', $today)
            ->toBase()
            ->selectRaw('COALESCE(SUM(quantity),0) as quantity, COALESCE(SUM(reject_quantity),0) as reject')
            ->first();

        return response()->json([
            'machines_total' => (int) $counts->sum(),
            'status_counts' => [
                'running' => (int) ($counts['running'] ?? 0),
                'idle' => (int) ($counts['idle'] ?? 0),
                'maintenance' => (int) ($counts['maintenance'] ?? 0),
                'error' => (int) ($counts['error'] ?? 0),
            ],
            'today' => [
                'date' => $today,
                'total_quantity' => (int) $production->quantity,
                'total_reject' => (int) $production->reject,
            ],
        ]);
    }
}
