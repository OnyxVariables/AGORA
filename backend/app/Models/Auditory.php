<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Auditory extends Model
{
    protected $table = 'auditory';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'userId',
        'action',
        'description',
        'txHash',
        'blockHash',
        'createdAt'
    ];

    protected $casts = [
        'createdAt' => 'datetime',
    ];

    public static function log(int $userId, string $action, ?string $description = null, ?string $txHash = null, ?string $blockHash = null): self
    {
        return self::create([
            'userId' => $userId,
            'action' => $action,
            'description' => $description,
            'txHash' => $txHash,
            'blockHash' => $blockHash,
            'createdAt' => now()
        ]);
    }
}
