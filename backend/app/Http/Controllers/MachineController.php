<?php

namespace App\Http\Controllers;

use App\Events\MachineUpdated;
use App\Http\Requests\MachineRequest;
use App\Http\Resources\MachineResource;
use App\Models\Machine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MachineController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', 'in:'.implode(',', Machine::TYPES)],
            'status' => ['nullable', 'in:'.implode(',', Machine::STATUSES)],
        ]);

        $machines = Machine::query()
            ->with('currentOperator:id,name,employee_code')
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->string('q')->trim().'%';
                $q->where(fn ($w) => $w->where('code', 'like', $term)->orWhere('name', 'like', $term));
            })
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->input('type')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->orderBy('code')
            ->get();

        return MachineResource::collection($machines);
    }

    public function store(MachineRequest $request): JsonResponse
    {
        $machine = Machine::create($request->validated())->refresh();

        event(new MachineUpdated($machine));

        return (new MachineResource($machine))->response()->setStatusCode(201);
    }

    public function update(MachineRequest $request, Machine $machine): MachineResource
    {
        $machine->update($request->validated());
        $machine->load('currentOperator:id,name,employee_code');

        event(new MachineUpdated($machine));

        return new MachineResource($machine);
    }

    public function destroy(Machine $machine): JsonResponse
    {
        if ($machine->productionRecords()->exists()) {
            return response()->json([
                'message' => 'Mesin tidak bisa dihapus karena sudah memiliki data produksi.',
            ], 422);
        }

        $machine->delete();

        event(new MachineUpdated($machine, deleted: true));

        return response()->json(['message' => 'Mesin berhasil dihapus.']);
    }
}
