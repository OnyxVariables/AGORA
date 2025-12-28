<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $table = 'province';
    public $timestamps = false;

    public function autonomousCommunity()
    {
        return $this->belongsTo(AutonomousCommunity::class, 'autonomousCommunityId');
    }
}
