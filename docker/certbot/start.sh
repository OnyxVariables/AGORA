#!/bin/sh

# LE debe poder hacer HTTP-01 a la IP pública:80. Si certbot arranca antes que nginx,
# falla con "connection refused" (común en docker compose up paralelo).
wait_for_nginx_http() {
    echo "Esperando a nginx (servicio server) en el puerto 80..."
    i=0
    while [ "$i" -lt 90 ]; do
        if curl -sf --max-time 2 "http://server:80/" >/dev/null 2>&1; then
            echo "Nginx responde en http://server:80 — listo para ACME."
            return 0
        fi
        i=$((i + 1))
        sleep 2
    done
    echo "WARN: nginx no respondió en 3 min; certbot puede fallar. Revisa agora_server."
    return 0
}

if [ ! -d "/etc/letsencrypt/live/agorachain.es" ]; then
    wait_for_nginx_http
    echo "Generando certificado Let’s Encrypt por primera vez"
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email agorachain@gmail.com \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        -d agorachain.es \
        -d www.agorachain.es \
        -d auth.agorachain.es
fi

echo "Iniciando renovación automática"
while :; do
    # En vez de intentar recargar nginx desde el contenedor certbot (no recarga nginx en otro contenedor),
    # le pongo un marker en el volumen compartido que nginx vigila. Si no no funciona porque nginx no comparte la imagen
    # y --deploy-hook falla
    certbot renew --deploy-hook "touch /var/www/certbot/reload_nginx"
    sleep 12h
done
