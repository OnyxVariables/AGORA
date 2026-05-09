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

# php artisan migrate
# In production, migrations require --force to avoid interactive confirmation.
php artisan migrate --force --no-interaction

# To optimize Laravel
php artisan config:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
