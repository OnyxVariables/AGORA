<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Model;

class Party extends Model
{
    protected $table = 'party';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'code',
        'description',
        'image',
        'color_background',
        'color_title',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function votations(): BelongsToMany
    {
        return $this->belongsToMany(Votation::class, 'votation_party', 'partyId', 'votationId');
    }
}