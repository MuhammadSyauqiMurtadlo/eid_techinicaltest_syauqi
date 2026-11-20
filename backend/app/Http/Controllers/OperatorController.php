<?php

namespace App\Http\Controllers;

use App\Http\Requests\OperatorRequest;
use App\Http\Resources\OperatorResource;
use App\Models\Operator;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class OperatorController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['q' => ['nullable', 'string', 'max:100']]);

        $operators = Operator::query()
            ->with('user:id,email')
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->string('q')->trim().'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('employee_code', 'like', $term));
            })
            ->orderBy('name')
            ->get();

        return OperatorResource::collection($operators);
    }

    public function store(OperatorRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Satu transaksi: akun login + profil operator
        $operator = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => User::ROLE_OPERATOR,
            ]);

            return $user->operator()->create([
                'employee_code' => $data['employee_code'],
                'name' => $data['name'],
                'phone' => $data['phone'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);
        });

        return (new OperatorResource($operator->load('user:id,email')))->response()->setStatusCode(201);
    }

    public function update(OperatorRequest $request, Operator $operator): OperatorResource
    {
        $data = $request->validated();
        $passwordChanged = ! empty($data['password']);

        DB::transaction(function () use ($data, $operator, $passwordChanged) {
            $userData = ['name' => $data['name'], 'email' => $data['email']];
            if ($passwordChanged) {
                $userData['password'] = $data['password'];
            }

            $operator->user->update($userData);
            $operator->update(Arr::only($data, ['employee_code', 'name', 'phone', 'is_active']));
        });

        // Nonaktif / ganti password → paksa logout semua sesi token operator tsb
        if ($passwordChanged || ! $operator->is_active) {
            $operator->user->tokens()->delete();
        }

        return new OperatorResource($operator->load('user:id,email'));
    }

    public function destroy(Operator $operator): JsonResponse
    {
        if ($operator->productionRecords()->exists()) {
            return response()->json([
                'message' => 'Operator sudah memiliki data produksi. Nonaktifkan saja, jangan dihapus.',
            ], 422);
        }

        DB::transaction(function () use ($operator) {
            $user = $operator->user;
            $user->tokens()->delete();
            $user->delete(); // operator ikut terhapus (cascade)
        });

        return response()->json(['message' => 'Operator berhasil dihapus.']);
    }
}
