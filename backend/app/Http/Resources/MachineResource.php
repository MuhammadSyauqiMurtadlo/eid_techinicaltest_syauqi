<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MachineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'type' => $this->type,
            'location' => $this->location,
            'status' => $this->status,
            'temperature' => $this->temperature !== null ? (float) $this->temperature : null,
            'output_per_minute' => (int) $this->output_per_minute,
            'current_operator_id' => $this->current_operator_id,
            'current_operator' => $this->whenLoaded('currentOperator', fn () => $this->currentOperator ? [
                'id' => $this->currentOperator->id,
                'name' => $this->currentOperator->name,
                'employee_code' => $this->currentOperator->employee_code,
            ] : null),
            'last_reported_at' => $this->last_reported_at?->toIso8601String(),
        ];
    }
}
