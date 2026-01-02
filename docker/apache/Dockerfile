FROM php:8.2-apache

RUN a2enmod ssl rewrite headers proxy proxy_fcgi

# Copiar vhost SSL
COPY vhost-ssl.conf /etc/apache2/sites-available/vhost-ssl.conf

# Habilitar SSL y el sitio
RUN a2ensite vhost-ssl && a2enmod ssl

# Copiar certificados
COPY ssl/ /etc/apache2/ssl/

# Código
COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html