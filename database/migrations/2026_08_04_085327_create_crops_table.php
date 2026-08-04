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
        Schema::create('crops', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->string('scientific_name')->nullable();
            $table->string('category');
            $table->text('description');
            $table->decimal('temp_min', 5, 1);
            $table->decimal('temp_opt_min', 5, 1);
            $table->decimal('temp_opt_max', 5, 1);
            $table->decimal('temp_max', 5, 1);
            $table->decimal('rainfall_min', 7, 1);
            $table->decimal('rainfall_opt_min', 7, 1);
            $table->decimal('rainfall_opt_max', 7, 1);
            $table->decimal('rainfall_max', 7, 1);
            $table->unsignedTinyInteger('humidity_min');
            $table->unsignedTinyInteger('humidity_max');
            $table->json('soil_types');
            $table->unsignedSmallInteger('cycle_days');
            $table->enum('water_need', ['low', 'moderate', 'high']);
            $table->string('planting_note');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crops');
    }
};
