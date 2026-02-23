<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Vote;
use App\Models\Municipality;

class VoteController extends Controller
{
    public function send(Request $request)
    {
        $vote = $request->input('vote');

        $request->validate([
            'vote.partyId' => 'required|integer|exists:party,id',
            'vote.votationId' => 'required|integer|exists:votation,id',
            'vote.municipality' => 'required|integer|exists:municipality,id',
            'vote.voteHash' => 'required|integer',
        ]);
            
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'error' => 'No autenticado'
                ], 401, [], JSON_UNESCAPED_UNICODE);
        }

        if (!$user->isActive) {
            return response()->json([
                'error' => 'El usuario ya ha votado'
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        Vote::create([
            'voteHash' => $voteHash,
            'votationId' => $vote['votationId'],
            'partyId' => $vote['partyId'],
            'municipalityId' => $vote['municipality'],
        ]);

        $user->setInactive();

        return response()->json([
            'message' => 'Voto registrado correctamente',
            'voteHash' => $voteHash,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}
