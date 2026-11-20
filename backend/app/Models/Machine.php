<?php

namespace App\Models;

use App\Events\MachineUpdated;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Machine extends Model
{
    public const TYPES = ['CNC', 'Milling', 'Press', 'Assembly'];
    public const STATUSES = ['running', 'idle', 'maintenance', 'error'];

    protected $fillable = [
        'code', 'name', 'type', 'location', 'status', 'temperature',
        'output_per_minute', 'current_operator_id', 'last_reported_at',
    ];

    protected function casts(): array
    {
        return [
            'temperature' => 'decimal:2',
            'output_per_minute' => 'integer',
            'last_reported_at' => 'datetime',
        ];
    }

    public function currentOperator(): BelongsTo
    {
        return $this->belongsTo(Operator::class, 'current_operator_id');
    }

    public function productionRecords(): HasMany
    {
        return $this->hasMany(ProductionRecord::class);
    }

    /**
     * Terapkan data telemetri (snapshot terkini) lalu broadcast ke dashboard.
     * Dipakai oleh endpoint telemetry dan command simulator.
     */
    public function applyTelemetry(array $data): static
    {
        $this->forceFill([
            'status' => $data['status'],
            'temperature' => $data['temperature'] ?? $this->temperature,
            // mesin yang tidak running dianggap tidak menghasilkan barang
            'output_per_minute' => $data['status'] === 'running' ? ($data['output_per_minute'] ?? 0) : 0,
            'last_reported_at' => now(),
        ]);

        if (array_key_exists('current_operator_id', $data)) {
            $this->current_operator_id = $data['current_operator_id'];
        }

        $this->save();
        $this->load('currentOperator:id,name,employee_code');

        event(new MachineUpdated($this));

        return $this;
    }
}
