<?php

namespace App\Http\Controllers;

use App\Http\Requests\TelemetryRequest;
use App\Http\Resources\MachineResource;
use App\Models\Machine;

class TelemetryController extends Controller
{
    public function store(TelemetryRequest $request, Machine $machine): MachineResource
    {
        return new MachineResource($machine->applyTelemetry($request->validated()));
    }
}
