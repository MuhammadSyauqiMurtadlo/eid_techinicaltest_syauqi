<?php

namespace App\Console\Commands;

use App\Models\Machine;
use App\Models\Operator;
use Illuminate\Console\Command;

class SimulateMachines extends Command
{
    protected $signature = 'machines:simulate
                            {--interval=3 : Jeda antar siklus (detik)}
                            {--once : Jalankan satu siklus saja}';

    protected $description = 'Simulasi telemetri mesin produksi (di-broadcast lewat Reverb)';

    /** Bobot kemunculan status */
    private const WEIGHTS = ['running' => 65, 'idle' => 15, 'maintenance' => 10, 'error' => 10];

    public function handle(): int
    {
        $interval = max(1, (int) $this->option('interval'));
        $operatorIds = Operator::where('is_active', true)->pluck('id')->all();

        $this->info('Simulator berjalan. Tekan Ctrl+C untuk berhenti.');

        do {
            Machine::query()->get()->each(function (Machine $machine) use ($operatorIds) {
                $reading = $this->nextReading($machine, $operatorIds);
                $machine->applyTelemetry($reading);

                $this->line(sprintf(
                    '[%s] %-7s %-11s %5.1f°C  %3d/menit',
                    now()->format('H:i:s'),
                    $machine->code,
                    $reading['status'],
                    $reading['temperature'],
                    $machine->output_per_minute,
                ));
            });

            if ($this->option('once')) {
                break;
            }

            sleep($interval);
        } while (true);

        return self::SUCCESS;
    }

    private function nextReading(Machine $machine, array $operatorIds): array
    {
        // 85% status bertahan, 15% berganti
        $status = mt_rand(1, 100) <= 15 ? $this->pickStatus() : $machine->status;
        $current = (float) ($machine->temperature ?? 45);

        $temperature = match ($status) {
            'running' => min(95, max(55, $current + mt_rand(-30, 40) / 10)),
            'idle' => mt_rand(350, 450) / 10,
            'maintenance' => mt_rand(300, 400) / 10,
            'error' => mt_rand(860, 1050) / 10,
        };

        $operatorId = null;
        if (in_array($status, ['running', 'error'], true) && $operatorIds) {
            $operatorId = $machine->current_operator_id ?? $operatorIds[array_rand($operatorIds)];
        }

        return [
            'status' => $status,
            'temperature' => round($temperature, 2),
            'output_per_minute' => $status === 'running' ? mt_rand(18, 60) : 0,
            'current_operator_id' => $operatorId,
        ];
    }

    private function pickStatus(): string
    {
        $roll = mt_rand(1, array_sum(self::WEIGHTS));
        $acc = 0;

        foreach (self::WEIGHTS as $status => $weight) {
            $acc += $weight;
            if ($roll <= $acc) {
                return $status;
            }
        }

        return 'idle';
    }
}
