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
    Schema::create('machines', function (Blueprint $table) {
        $table->id();
        $table->string('code', 30)->unique();
        $table->string('name');
        $table->enum('type', ['CNC', 'Milling', 'Press', 'Assembly']);
        $table->string('location')->nullable();
        $table->enum('status', ['running', 'idle', 'maintenance', 'error'])->default('idle');
        $table->decimal('temperature', 5, 2)->nullable();
        $table->unsignedInteger('output_per_minute')->default(0);
        $table->foreignId('current_operator_id')->nullable()->constrained('operators')->nullOnDelete();
        $table->timestamp('last_reported_at')->nullable();
        $table->timestamps();

        $table->index(['type', 'status']);
    });
}

public function down(): void
{
    Schema::dropIfExists('machines');
}
};
