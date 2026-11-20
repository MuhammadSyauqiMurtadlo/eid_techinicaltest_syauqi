<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\Operator;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        // operator biasa hanya melihat dirinya sendiri (dikunci di form produksi)
        $operators = Operator::query()
            ->where('is_active', true)
            ->when(! $user->isAdministrator(), fn ($q) => $q->where('user_id', $user->id))
            ->orderBy('name')
            ->get(['id', 'employee_code', 'name']);

        return response()->json([
            'machines' => Machine::orderBy('code')->get(['id', 'code', 'name', 'type']),
            'shifts' => Shift::orderBy('id')->get(['id', 'name', 'start_time', 'end_time']),
            'operators' => $operators,
        ]);
    }
}
