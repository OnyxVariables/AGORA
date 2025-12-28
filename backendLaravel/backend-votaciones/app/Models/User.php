<?php

namespace App\Models;

//Importante para poder usar Auth::login($user), Auth::check(), Auth::user() 
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $table = 'user';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'dni',
        'name',
        'municipalityId',
        'isActive',
        'nicknamePassword'
    ];

    public function municipality()
    {
        return $this->belongsTo(Municipality::class, 'municipalityId');
    }
}