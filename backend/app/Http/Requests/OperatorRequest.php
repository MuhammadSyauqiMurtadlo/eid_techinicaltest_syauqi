<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class OperatorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $operator = $this->route('operator'); // null saat store
        $isUpdate = $operator !== null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'email:rfc', 'max:255',
                Rule::unique('users', 'email')->ignore($operator?->user_id),
            ],
            'password' => [$isUpdate ? 'nullable' : 'required', Password::min(8)],
            'employee_code' => [
                'required', 'string', 'max:30',
                Rule::unique('operators', 'employee_code')->ignore($operator?->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
