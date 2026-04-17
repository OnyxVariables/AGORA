<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Autenticación demo (solo desarrollo local)
    |--------------------------------------------------------------------------
    |
    | Si AGORA_DEMO_AUTH=true y APP_ENV=local, /api/login-cert acepta la
    | cabecera X-Demo-DNI sin certificado cliente. No activar en producción.
    |
    */
    'demo_auth' => env('AGORA_DEMO_AUTH', false),

];