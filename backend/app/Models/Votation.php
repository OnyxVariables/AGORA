<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Votation extends Model
{
    protected $table = 'votation';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'txHash',
        'startBlockHash',
        'endBlockHash',
        'title',
        'description',
        'startDate',
        'endDate',
        'state'
    ];

    /**
     * Votación usable por ciudadanos: en BD ya activa, o pending con tx de creación
     * (la cadena ya tiene la votación; Spring puede tardar en marcarla active).
     */
    public function scopeVotableForCitizens(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->where('state', 'active')
                ->orWhere(function (Builder $q2) {
                    $q2->where('state', 'pending')
                        ->whereNotNull('txHash')
                        ->where('txHash', '!=', '');
                });
        })
            ->where('startDate', '<=', now())
            ->where(function (Builder $q) {
                $q->whereNull('endDate')
                    ->orWhere('endDate', '>', now());
            });
    }

    public function parties(): BelongsToMany
    {
        return $this->belongsToMany(Party::class, 'votation_party', 'votationId', 'partyId');
    }
}