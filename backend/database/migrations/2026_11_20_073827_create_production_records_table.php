<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::create('production_records', function (Blueprint $table) {
        $table->id();
        $table->foreignId('machine_id')->constrained()->restrictOnDelete();
        $table->foreignId('operator_id')->constrained()->restrictOnDelete();
        $table->foreignId('shift_id')->constrained()->restrictOnDelete();
        $table->date('production_date');
        $table->unsignedInteger('quantity');
        $table->unsignedInteger('reject_quantity')->default(0);
        $table->text('notes')->nullable();
        $table->timestamps();

        // untuk query laporan (filter tanggal + mesin + shift)
        $table->index(['production_date', 'machine_id', 'shift_id']);
    });
}

public function down(): void
{
    Schema::dropIfExists('production_records');
}
};
