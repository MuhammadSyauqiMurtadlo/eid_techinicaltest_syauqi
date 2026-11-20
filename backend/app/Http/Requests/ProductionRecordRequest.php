<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class ProductionRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // akses dibatasi middleware role di routes
    }

    protected function prepareForValidation(): void
    {
        $user = $this->user();

        // Role operator: operator_id dikunci ke dirinya sendiri (abaikan input dari client)
        if ($user && $user->role === User::ROLE_OPERATOR) {
            $this->merge(['operator_id' => $user->operator?->id]);
        }
    }

    public function rules(): array
    {
        return [
            'machine_id' => ['required', 'integer', 'exists:machines,id'],
            'operator_id' => ['required', 'integer', 'exists:operators,id'],
            'shift_id' => ['required', 'integer', 'exists:shifts,id'],
            'production_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'quantity' => ['required', 'integer', 'min:0', 'max:1000000'],
            'reject_quantity' => ['nullable', 'integer', 'min:0', 'lte:quantity'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'operator_id.required' => 'Akun Anda belum terhubung dengan data operator.',
            'reject_quantity.lte' => 'Jumlah reject tidak boleh melebihi jumlah produksi.',
            'production_date.before_or_equal' => 'Tanggal produksi tidak boleh di masa depan.',
        ];
    }
}
