#!/bin/sh

# LE debe poder hacer HTTP-01 a la IP pública:80. Si certbot arranca antes que nginx,
# falla con "connection refused" (común en docker compose up paralelo).
# Comprueba TCP 80 al contenedor nginx (Compose DNS: nombre del servicio y container_name).
probe_port80() {
    host="$1"
    if command -v curl >/dev/null 2>&1; then
        curl -4sf --max-time 3 "http://${host}:80/" >/dev/null 2>&1 && return 0
    fi
    if command -v wget >/dev/null 2>&1; then
        wget -q -T 3 -O /dev/null "http://${host}:80/" 2>/dev/null && return 0
    fi
    return 1
}

wait_for_nginx_http() {
    echo "Esperando a nginx en la red Docker (puerto 80)..."
    i=0
    while [ "$i" -lt 90 ]; do
        for host in server agora_server; do
            if probe_port80 "$host"; then
                echo "OK: nginx responde en http://${host}:80 — listo para ACME."
                return 0
            fi
        done
        if [ "$i" -eq 0 ]; then
            echo "(Si esto tarda: mismo proyecto compose + red agora; imagen con curl tras rebuild.)"
        fi
        i=$((i + 1))
        sleep 2
    done
    echo "WARN: nginx no respondió en 3 min en server/agora_server:80."
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
