#!/bin/sh
set -eu

cd /var/www/html

if [ -n "${RENDER_EXTERNAL_HOSTNAME:-}" ]; then
    export APP_URL="https://${RENDER_EXTERNAL_HOSTNAME}"
fi

mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache

php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

attempt=1
until php artisan migrate --force; do
    if [ "$attempt" -ge 6 ]; then
        echo "Database migrations failed after ${attempt} attempts." >&2
        exit 1
    fi

    echo "Database is not ready; retrying migration in 5 seconds (${attempt}/6)..." >&2
    attempt=$((attempt + 1))
    sleep 5
done

# CropSeeder uses updateOrCreate, so this remains safe on every deploy.
php artisan db:seed --force

php-fpm --daemonize
exec nginx -g 'daemon off;'
