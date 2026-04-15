<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoteIntent extends Model
{
    protected $table = 'vote_intent';

    protected $fillable = [
        'userId',
        'voteHash',
        'votationId',
    ];

    public $timestamps = false;

    protected $casts = [
        'createdAt' => 'datetime',
    ];
}
