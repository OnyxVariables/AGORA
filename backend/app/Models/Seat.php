<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seat extends Model
{
    protected $table = 'seat';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'votationId',
        'provinceId',
        'partyId',
        'seatsAssigned',
        'votes',
        'calculationDate',
    ];

    public function votation()
    {
        return $this->belongsTo(Votation::class, 'votationId');
    }

    public function province()
    {
        return $this->belongsTo(Province::class, 'provinceId');
    }

    public function party()
    {
        return $this->belongsTo(Party::class, 'partyId');
    }
}