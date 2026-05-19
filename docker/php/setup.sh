#!/bin/sh
set -e

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    touch .env
  fi
fi

until php -r "
try {
    new PDO(
        'mysql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT'),
        getenv('DB_USERNAME'),
        getenv('DB_PASSWORD')
    );
} catch (Exception \$e) {
    echo \$e->getMessage() . PHP_EOL;
    exit(1);
}"; do
  echo "Waiting for database..."
  sleep 2
done

echo "Database is up"

# ABI del contrato: la imagen trae /opt/agora/SimpleVoting.json (compilado en el build).
# SIMPLE_VOTING_ABI_PATH solo cambia dónde lo lee Laravel, no copia desde el host.
install_contract_abi() {
  BUNDLED=/opt/agora/SimpleVoting.json
  DEST="${SIMPLE_VOTING_ABI_PATH:-/var/www/html/storage/app/SimpleVoting.json}"

  if [ ! -f "$BUNDLED" ]; then
    echo "AVISO: no hay ABI embebido en $BUNDLED (reconstruye la imagen backend)."
    return 0
  fi

  mkdir -p "$(dirname "$DEST")"

  if [ "${AGORA_FORCE_ABI_SYNC:-false}" = "true" ] || [ ! -f "$DEST" ]; then
    cp "$BUNDLED" "$DEST"
    chown www-data:www-data "$DEST" 2>/dev/null || true
    echo "ABI SimpleVoting instalado en $DEST"
  fi
}

install_contract_abi

# Rebuild package manifest from vendor/ (image uses composer --no-dev; stale
# bootstrap/cache/packages.php must not reference dev-only packages like laravel/pail).
php artisan package:discover --ansi

# Generate APP_KEY if not present or empty in .env file
# Check if .env exists and has a valid APP_KEY (non-empty value after =)
if [ ! -f .env ] || ! grep -qE '^APP_KEY=base64:[A-Za-z0-9+/]{40,}={0,2}$' .env 2>/dev/null; then
  echo "Generating APP_KEY..."
  # Generate key directly into .env file
  KEY=$(php -r "echo 'base64:' . base64_encode(random_bytes(32));")
  if grep -q '^APP_KEY=' .env 2>/dev/null; then
    # Replace existing APP_KEY line
    sed -i "s/^APP_KEY=.*/APP_KEY=${KEY}/" .env
  else
    # Add APP_KEY to end of file
    echo "APP_KEY=${KEY}" >> .env
  fi
  echo "APP_KEY generated successfully"
fi

# backend y scheduler comparten backend_data y arrancan setup.sh a la vez: sin esto
# ambos intentan crear la tabla `migrations` y uno falla con SQLSTATE 42S01.
run_migrations() {
  if [ "${AGORA_SKIP_MIGRATE:-false}" = "true" ]; then
    echo "Migraciones omitidas (AGORA_SKIP_MIGRATE=true; p. ej. contenedor scheduler)."
    return 0
  fi

  set +e
  OUTPUT=$(php artisan migrate --force --no-interaction 2>&1)
  CODE=$?
  set -e

  if [ "$CODE" -eq 0 ]; then
    echo "$OUTPUT"
    return 0
  fi

  if echo "$OUTPUT" | grep -qi "table 'migrations' already exists"; then
    echo "Migraciones: otro contenedor creó la tabla migrations; reintentando..."
    sleep 2
    php artisan migrate --force --no-interaction
    return $?
  fi

  echo "$OUTPUT" >&2
  return "$CODE"
}

run_migrations

# To optimize Laravel
php artisan config:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
