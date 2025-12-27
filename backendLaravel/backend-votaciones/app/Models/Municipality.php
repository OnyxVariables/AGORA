<?php
//Para crearlo utilizo (php artisan make:model Municipality)
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Municipality extends Model
{
    protected $table = 'municipality';
    public $timestamps = false;

    public function province()
    {
        return $this->belongsTo(Province::class, 'provinceId');
    }
}
