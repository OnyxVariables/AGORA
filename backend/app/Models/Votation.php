<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Votation extends Model
{
    protected $table = 'votation';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'blockchainId',
        'txHash',
        'startBlockHash',
        'endBlockHash',
        'title',
        'description',
        'startDate',
        'endDate',
        'state'
    ];
}