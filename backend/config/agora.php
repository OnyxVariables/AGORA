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

    /*
    |--------------------------------------------------------------------------
    | Modo inseguro temporal
    |--------------------------------------------------------------------------
    |
    | Si AGORA_INSECURE_MODE=true, la API deja de depender de sesiones/Sanctum
    | para las rutas protegidas y usa usuarios fijos de la base de datos para
    | representar al ciudadano y al administrador.
    |
    */
    'insecure_mode' => filter_var(env('AGORA_INSECURE_MODE', false), FILTER_VALIDATE_BOOL),
    'insecure_admin_user_id' => env('AGORA_INSECURE_ADMIN_USER_ID')
        ? (int) env('AGORA_INSECURE_ADMIN_USER_ID')
        : null,
    'insecure_citizen_user_id' => env('AGORA_INSECURE_CITIZEN_USER_ID')
        ? (int) env('AGORA_INSECURE_CITIZEN_USER_ID')
        : null,

    /*
    |--------------------------------------------------------------------------
    | Duración fija de las votaciones
    |--------------------------------------------------------------------------
    |
    | Tiempo (en minutos) que el servidor asigna entre startDate y endDate al
    | crear una votación. Se centraliza aquí para que tanto el backend como
    | el frontend lean el mismo valor (vía /api/votations/config).
    |
    | Para producción se suele subir a 720 (12 h). En desarrollo se deja en
    | 5 min para poder hacer demos rápidas sin esperar.
    |
    */
    'votation' => [
        'duration_minutes' => (int) env('VOTATION_DURATION_MINUTES', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | ABI del contrato SimpleVoting (Hardhat artifact)
    |--------------------------------------------------------------------------
    |
    | Si SIMPLE_VOTING_ABI_PATH está vacío en .env/Compose, usar el path por
    | defecto bajo storage/app (setup.sh lo copia desde la imagen en prod).
    |
    */
    'simple_voting_abi_path' => (($configuredAbiPath = env('SIMPLE_VOTING_ABI_PATH')) !== null
        && trim((string) $configuredAbiPath) !== '')
        ? trim((string) $configuredAbiPath)
        : storage_path('app/SimpleVoting.json'),

];