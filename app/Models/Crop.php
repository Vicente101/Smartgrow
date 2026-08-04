<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Crop extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'soil_types' => 'array',
            'temp_min' => 'float',
            'temp_opt_min' => 'float',
            'temp_opt_max' => 'float',
            'temp_max' => 'float',
            'rainfall_min' => 'float',
            'rainfall_opt_min' => 'float',
            'rainfall_opt_max' => 'float',
            'rainfall_max' => 'float',
        ];
    }
}
