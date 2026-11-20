<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'operator' => $this->whenLoaded('operator', fn () => $this->operator ? [
                'id' => $this->operator->id,
                'employee_code' => $this->operator->employee_code,
                'name' => $this->operator->name,
            ] : null),
        ];
    }
}
