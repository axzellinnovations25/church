<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    use HasFactory;

    /**
     * --------------------------------------------------------------------------
     * Table Name
     * --------------------------------------------------------------------------
     * Explicitly define the database table used by this model.
     */

    protected $table = 'contact_messages';

    /**
     * --------------------------------------------------------------------------
     * Mass Assignable Fields
     * --------------------------------------------------------------------------
     * These fields are allowed when creating or updating records.
     */

    protected $fillable = [
        'name',
        'email',
        'phone',
        'subject',
        'category',
        'status',
        'group_id',
        'message'
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }
} 
