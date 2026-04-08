<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    protected $table = 'vote';
    protected $primaryKey = 'id';
    protected $fillable = [
        'voteHash',
        'votationId',
        'partyId',
        'municipalityId',
        'blockHash',
        'txHash',
        'createdAt'
    ];
    
    public $timestamps = false;

    public function votation()
    {
        return $this->belongsTo(Votation::class, 'id');
    }

    public function party()
    {
        return $this->belongsTo(Party::class, 'id');
    }

    public function municipality()
    {
        return $this->belongsTo(Municipality::class, 'id');
    }
}
