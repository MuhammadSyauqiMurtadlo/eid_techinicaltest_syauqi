<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductionRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'production_date' => $this->production_date->format('Y-m-d'),
            'machine_id' => $this->machine_id,
            'operator_id' => $this->operator_id,
            'shift_id' => $this->shift_id,
            'quantity' => $this->quantity,
            'reject_quantity' => $this->reject_quantity,
            'notes' => $this->notes,
            'machine' => $this->whenLoaded('machine', fn () => [
                'id' => $this->machine->id,
                'code' => $this->machine->code,
                'name' => $this->machine->name,
                'type' => $this->machine->type,
            ]),
            'operator' => $this->whenLoaded('operator', fn () => [
                'id' => $this->operator->id,
                'name' => $this->operator->name,
                'employee_code' => $this->operator->employee_code,
            ]),
            'shift' => $this->whenLoaded('shift', fn () => [
                'id' => $this->shift->id,
                'name' => $this->shift->name,
            ]),
        ];
    }
}
