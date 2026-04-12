<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Block extends Model
{
    protected $table = 'block';
    protected $primaryKey = 'hash';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'hash',
        'blockNumber',
        'previousHash',
        'transactions',
        'isValid'
    ];

    protected $casts = [
        'isValid' => 'boolean',
        'createdAt' => 'datetime'
    ];
}
