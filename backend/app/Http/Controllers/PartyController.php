<?php

namespace App\Http\Controllers;
use App\Models\Party;

use Illuminate\Http\Request;

class PartyController extends Controller
{
    public function index()
    {
        return Party::where('active', true)
            ->select(
                'id',
                'name',
                'description',
                'code',
                'image',
                'color_background',
                'color_title'
            )
            ->orderBy('id')
            ->get();
    }
}
