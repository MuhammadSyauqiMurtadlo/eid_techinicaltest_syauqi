<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OperatorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'employee_code' => $this->employee_code,
            'name' => $this->name,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'email' => $this->whenLoaded('user', fn () => $this->user->email),
        ];
    }
}
