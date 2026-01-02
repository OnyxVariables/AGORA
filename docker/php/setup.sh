#!/bin/sh

if [ ! -f .env ]; then
  cp .env.example .env
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

if ! grep -q "^APP_KEY=.\+" .env; then
  php artisan key:generate
fi

php artisan migrate

# To optimize Laravel
php artisan config:clear
php artisan route:clear

exec "$@"
