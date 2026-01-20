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

# Renovacion automatica
echo "Iniciando renovación automática"
while :; do
    certbot renew --deploy-hook "nginx -s reload"
    sleep 12h
done