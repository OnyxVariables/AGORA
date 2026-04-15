<?php

namespace App\Models;

//Importante para poder usar Auth::login($user), Auth::check(), Auth::user() 
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory;
    protected $table = 'user';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'dni',
        'name',
        'roleId',
        'municipalityId',
        'isActive',
        'nicknamePassword',
    ];

    public function municipality()
    {
        return $this->belongsTo(Municipality::class, 'municipalityId');
    }

    public function setInactive()
    {
        $this->isActive = false;
        $this->save();
    }
}
