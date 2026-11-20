<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductionFilterRequest;
use App\Http\Resources\ProductionRecordResource;
use App\Models\ProductionRecord;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(ProductionFilterRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $base = fn () => ProductionRecord::query()->filter($filters);

        $summary = $base()->toBase()
            ->selectRaw('COUNT(*) as records_count, COALESCE(SUM(quantity),0) as total_quantity, COALESCE(SUM(reject_quantity),0) as total_reject')
            ->first();

        $byDate = $base()
            ->selectRaw('production_records.production_date as date, SUM(quantity) as quantity, SUM(reject_quantity) as reject')
            ->groupBy('production_records.production_date')
            ->orderBy('production_records.production_date')
            ->toBase()->get()
            ->map(fn ($r) => [
                'date' => $r->date,
                'quantity' => (int) $r->quantity,
                'reject' => (int) $r->reject,
            ]);

        $byMachine = $base()
            ->join('machines', 'machines.id', '=', 'production_records.machine_id')
            ->selectRaw('machines.id as machine_id, machines.code, machines.name, SUM(production_records.quantity) as quantity, SUM(production_records.reject_quantity) as reject')
            ->groupBy('machines.id', 'machines.code', 'machines.name')
            ->orderBy('machines.code')
            ->toBase()->get()
            ->map(fn ($r) => [
                'machine_id' => $r->machine_id,
                'code' => $r->code,
                'name' => $r->name,
                'quantity' => (int) $r->quantity,
                'reject' => (int) $r->reject,
            ]);

        $records = $base()
            ->with(['machine:id,code,name,type', 'operator:id,name,employee_code', 'shift:id,name'])
            ->latest('production_records.production_date')
            ->latest('production_records.id')
            ->paginate((int) ($filters['per_page'] ?? 10));

        $totalQuantity = (int) $summary->total_quantity;
        $totalReject = (int) $summary->total_reject;

        return response()->json([
            'summary' => [
                'records_count' => (int) $summary->records_count,
                'total_quantity' => $totalQuantity,
                'total_reject' => $totalReject,
                'total_good' => $totalQuantity - $totalReject,
            ],
            'by_date' => $byDate,
            'by_machine' => $byMachine,
            'records' => [
                'data' => ProductionRecordResource::collection($records)->resolve(),
                'meta' => [
                    'current_page' => $records->currentPage(),
                    'last_page' => $records->lastPage(),
                    'per_page' => $records->perPage(),
                    'total' => $records->total(),
                ],
            ],
        ]);
    }

    public function export(ProductionFilterRequest $request): StreamedResponse
    {
        $filters = $request->validated();
        $filename = 'laporan-produksi-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($filters) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // BOM supaya Excel membaca UTF-8

            $put = fn (array $row) => fputcsv($out, $row, ',', '"', '\\');

            $put(['Tanggal', 'Kode Mesin', 'Nama Mesin', 'Shift', 'Operator', 'Jumlah Produksi', 'Reject', 'Produksi Bersih', 'Catatan']);

            ProductionRecord::query()
                ->filter($filters)
                ->with(['machine:id,code,name', 'operator:id,name', 'shift:id,name'])
                ->orderBy('production_records.production_date')
                ->orderBy('production_records.id')
                ->lazy(500) // hemat memori untuk data besar
                ->each(function (ProductionRecord $r) use ($put) {
                    $put([
                        $r->production_date->format('Y-m-d'),
                        $r->machine->code,
                        $this->csvSafe($r->machine->name),
                        $r->shift->name,
                        $this->csvSafe($r->operator->name),
                        $r->quantity,
                        $r->reject_quantity,
                        $r->quantity - $r->reject_quantity,
                        $this->csvSafe($r->notes),
                    ]);
                });

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** Cegah CSV/formula injection saat file dibuka di Excel */
    private function csvSafe(?string $value): string
    {
        $value = (string) $value;

        return preg_match('/^[=+\-@\t\r]/', $value) ? "'".$value : $value;
    }
}
