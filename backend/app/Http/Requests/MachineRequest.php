<?php

namespace App\Http\Requests;

use App\Models\Machine;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MachineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge(['code' => strtoupper(trim((string) $this->input('code')))]);
        }
    }

    public function rules(): array
    {
        return [
            'code' => [
                'required', 'string', 'max:30', 'regex:/^[A-Z0-9\-]+$/',
                Rule::unique('machines', 'code')->ignore($this->route('machine')),
            ],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(Machine::TYPES)],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(Machine::STATUSES)],
        ];
    }

    public function messages(): array
    {
        return ['code.regex' => 'Kode hanya boleh huruf kapital, angka, dan tanda minus (contoh: CNC-01).'];
    }
}
