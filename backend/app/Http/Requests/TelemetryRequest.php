<?php

namespace App\Http\Requests;

use App\Models\Machine;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TelemetryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(Machine::STATUSES)],
            'temperature' => ['nullable', 'numeric', 'between:0,999.99'],
            'output_per_minute' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'current_operator_id' => ['nullable', 'integer', 'exists:operators,id'],
        ];
    }
}
