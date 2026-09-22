<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ParishRegistration extends Model
{
    use HasFactory;

    /**
     * --------------------------------------------------------------------------
     * Table Name
     * --------------------------------------------------------------------------
     */

    protected $table = 'parish_registrations';

    /**
     * --------------------------------------------------------------------------
     * Mass Assignable Fields
     * --------------------------------------------------------------------------
     */

    protected $fillable = [
        'member_id',
        'registration_type',
        'full_name',
        'date_of_birth',
        'gender',
        'nationality',
        'occupation',
        'address_line1',
        'address_line2',
        'city',
        'postcode',
        'partner_name',
        'phone',
        'email',
        'partner_name',
        'contact_by_phone',
        'contact_by_email',
        'consent_confirmed',
        'signature',
        'signed_date'
    ];

    /**
     * --------------------------------------------------------------------------
     * Boot Method
     * --------------------------------------------------------------------------
     * Automatically generate a unique member ID when a new registration is created.
     */

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($registration) {
            if ($registration->member_id) {
                return;
            }

            $lastNumber = self::query()
                ->whereNotNull('member_id')
                ->pluck('member_id')
                ->map(function ($memberId) {
                    preg_match('/^SMC(\d+)$/', (string) $memberId, $matches);

                    return isset($matches[1]) ? (int) $matches[1] : 0;
                })
                ->max() ?? 0;

            $registration->member_id = 'SMC' . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        });
    }

    public function children(): HasMany
    {
        return $this->hasMany(ParishChild::class, 'registration_id');
    }

    public function interest(): HasOne
    {
        return $this->hasOne(ParishInterest::class, 'registration_id');
    }
}
