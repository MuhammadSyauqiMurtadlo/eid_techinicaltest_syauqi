<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductionFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => [
                'nullable', 'date_format:Y-m-d',
                Rule::when($this->filled('date_from'), ['after_or_equal:date_from']),
            ],
            'machine_id' => ['nullable', 'integer', 'exists:machines,id'],
            'shift_id' => ['nullable', 'integer', 'exists:shifts,id'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
