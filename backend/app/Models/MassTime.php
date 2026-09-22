<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MassTime extends Model
{
    use HasFactory;

    /**
     * --------------------------------------------------------------------------
     * Table Name
     * --------------------------------------------------------------------------
     * Explicitly define the table name used by this model.
     */

    protected $table = 'mass_times';

    /**
     * --------------------------------------------------------------------------
     * Mass Assignable Fields
     * --------------------------------------------------------------------------
     * These fields can be filled using create() or update().
     */

    protected $fillable = [
        'day',
        'start_time',
        'end_time',
        'location',
        'language',
        'notes',
        'status',
        'sort_order',
    ];

    /**
     * --------------------------------------------------------------------------
     * Attribute Casting
     * --------------------------------------------------------------------------
     * Automatically cast database fields to correct types.
     */

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time'   => 'datetime:H:i',
    ];
}
