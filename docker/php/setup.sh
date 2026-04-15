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

# Generate key only when Compose/runtime did not inject a non-empty APP_KEY
# and the .env file has no key yet (empty APP_KEY= is not enough).
if [ -z "${APP_KEY}" ] && ! grep -qE '^APP_KEY=.+$' .env; then
  php artisan key:generate
fi

php artisan migrate

# To optimize Laravel
php artisan config:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
