<?php

namespace Database\Seeders;

use App\Models\Machine;
use App\Models\Operator;
use App\Models\ProductionRecord;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedShifts();
        $this->seedUsers();
        $this->seedMachines();
        $this->seedProductionRecords();
    }

    private function seedShifts(): void
    {
        foreach ([
            ['Shift 1', '07:00:00', '15:00:00'],
            ['Shift 2', '15:00:00', '23:00:00'],
            ['Shift 3', '23:00:00', '07:00:00'],
        ] as [$name, $start, $end]) {
            Shift::create(['name' => $name, 'start_time' => $start, 'end_time' => $end]);
        }
    }

    private function seedUsers(): void
    {
        // Akun demo — ganti password-nya jika dipakai selain untuk testing
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@example.com',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
        ]);

        foreach ([
            ['Budi Santoso', 'operator@example.com', 'OP-001', '081234567801'],
            ['Siti Aminah', 'siti@example.com', 'OP-002', '081234567802'],
            ['Agus Prasetyo', 'agus@example.com', 'OP-003', '081234567803'],
            ['Dewi Lestari', 'dewi@example.com', 'OP-004', '081234567804'],
        ] as [$name, $email, $code, $phone]) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => 'password',
                'role' => User::ROLE_OPERATOR,
            ]);

            $user->operator()->create([
                'employee_code' => $code,
                'name' => $name,
                'phone' => $phone,
                'is_active' => true,
            ]);
        }
    }

    private function seedMachines(): void
    {
        $operators = Operator::orderBy('id')->pluck('id')->all();

        foreach ([
            ['CNC-01', 'CNC Lathe A', 'CNC', 'Hall A', 'running', 62.5, 45, $operators[0]],
            ['CNC-02', 'CNC Lathe B', 'CNC', 'Hall A', 'idle', 38.0, 0, null],
            ['MIL-01', 'Milling Center 1', 'Milling', 'Hall B', 'running', 78.4, 32, $operators[1]],
            ['PRS-01', 'Hydraulic Press 1', 'Press', 'Hall C', 'error', 91.2, 0, $operators[2]],
            ['ASM-01', 'Assembly Line 1', 'Assembly', 'Hall D', 'maintenance', 33.0, 0, null],
        ] as [$code, $name, $type, $location, $status, $temp, $output, $operatorId]) {
            Machine::create([
                'code' => $code,
                'name' => $name,
                'type' => $type,
                'location' => $location,
                'status' => $status,
                'temperature' => $temp,
                'output_per_minute' => $output,
                'current_operator_id' => $operatorId,
                'last_reported_at' => now(),
            ]);
        }
    }

    private function seedProductionRecords(): void
    {
        $machines = Machine::orderBy('id')->get();
        $operators = Operator::orderBy('id')->pluck('id')->all();
        $shiftIds = Shift::orderBy('id')->pluck('id')->all();
        $now = now();
        $rows = [];

        for ($d = 6; $d >= 0; $d--) {
            $date = $now->copy()->subDays($d)->toDateString();

            foreach ($machines as $machine) {
                foreach ($shiftIds as $shiftId) {
                    // sebagian shift tidak ada produksi supaya data bervariasi
                    if ($shiftId === 3 && mt_rand(0, 1) === 0) {
                        continue;
                    }

                    $quantity = mt_rand(300, 600);
                    $operatorId = $operators[array_rand($operators)];
                    $reject = mt_rand(0, (int) ($quantity / 20));

                    // Contoh dari soal: CNC menghasilkan 500 barang pada Shift 1 oleh Budi hari ini
                    if ($d === 0 && $machine->code === 'CNC-01' && $shiftId === $shiftIds[0]) {
                        $quantity = 500;
                        $reject = 12;
                        $operatorId = $operators[0];
                    }

                    $rows[] = [
                        'machine_id' => $machine->id,
                        'operator_id' => $operatorId,
                        'shift_id' => $shiftId,
                        'production_date' => $date,
                        'quantity' => $quantity,
                        'reject_quantity' => $reject,
                        'notes' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        ProductionRecord::insert($rows);
    }
}
