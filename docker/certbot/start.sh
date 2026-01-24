#!/bin/sh
 
if [ ! -d "/etc/letsencrypt/live/agorachain.es" ]; then
    echo "Generando certificado Let’s Encrypt por primera vez"
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email agorachain@gmail.com \
        --agree-tos \
        --no-eff-email \
        -d agorachain.es \
        -d www.agorachain.es
fi

echo "Iniciando renovación automática"
while :; do
    # En vez de intentar recargar nginx desde el contenedor certbot (no recarga nginx en otro contenedor),
    # le pongo un marker en el volumen compartido que nginx vigila. Si no no funciona porque nginx no comparte la imagen
    # y --deploy-hook falla
    certbot renew --deploy-hook "touch /var/www/certbot/reload_nginx"
    sleep 12h
done