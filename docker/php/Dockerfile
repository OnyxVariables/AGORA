FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    bash \
    git \
    curl \
    unzip \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    openssl-dev \
    gmp-dev

RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    intl \
    zip \
    opcache \
    bcmath \
    gmp

COPY ./docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/composer.json backend/composer.lock ./

COPY ./docker/php/setup.sh ./
RUN chmod +x ./setup.sh

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts

COPY backend ./

RUN chown -R www-data:www-data \
    storage \
    bootstrap/cache

ENTRYPOINT ["./setup.sh"]
CMD ["php-fpm"]

EXPOSE 9000
