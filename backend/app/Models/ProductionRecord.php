<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionRecord extends Model
{
    protected $fillable = [
        'machine_id', 'operator_id', 'shift_id', 'production_date',
        'quantity', 'reject_quantity', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'production_date' => 'date:Y-m-d',
            'quantity' => 'integer',
            'reject_quantity' => 'integer',
        ];
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(Operator::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['date_from'] ?? null, fn (Builder $q, $v) => $q->where('production_records.production_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn (Builder $q, $v) => $q->where('production_records.production_date', '<=', $v))
            ->when($filters['machine_id'] ?? null, fn (Builder $q, $v) => $q->where('production_records.machine_id', $v))
            ->when($filters['shift_id'] ?? null, fn (Builder $q, $v) => $q->where('production_records.shift_id', $v));
    }
}
