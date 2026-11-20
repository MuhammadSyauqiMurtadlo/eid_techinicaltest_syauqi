<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductionFilterRequest;
use App\Http\Requests\ProductionRecordRequest;
use App\Http\Resources\ProductionRecordResource;
use App\Models\ProductionRecord;
use Illuminate\Http\JsonResponse;

class ProductionRecordController extends Controller
{
    private const RELATIONS = [
        'machine:id,code,name,type',
        'operator:id,name,employee_code',
        'shift:id,name',
    ];

    public function index(ProductionFilterRequest $request)
    {
        $filters = $request->validated();

        $records = ProductionRecord::query()
            ->filter($filters)
            ->with(self::RELATIONS)
            ->latest('production_date')
            ->latest('id')
            ->paginate((int) ($filters['per_page'] ?? 15));

        return ProductionRecordResource::collection($records);
    }

    public function store(ProductionRecordRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['reject_quantity'] ??= 0;

        $record = ProductionRecord::create($data)->load(self::RELATIONS);

        return (new ProductionRecordResource($record))->response()->setStatusCode(201);
    }

    public function update(ProductionRecordRequest $request, ProductionRecord $productionRecord): ProductionRecordResource
    {
        $data = $request->validated();
        $data['reject_quantity'] ??= 0;

        $productionRecord->update($data);

        return new ProductionRecordResource($productionRecord->load(self::RELATIONS));
    }

    public function destroy(ProductionRecord $productionRecord): JsonResponse
    {
        $productionRecord->delete();

        return response()->json(['message' => 'Data produksi berhasil dihapus.']);
    }
}
