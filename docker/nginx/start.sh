#!/bin/sh
set -e

# Rutas imagen
NGINX_CONF_DIR="/etc/nginx/conf.d"
HTTP_SRC="/docker_nginx/http.conf"
HTTP_REDIRECT_SRC="/docker_nginx/http_redirect.conf"
SSL_TEMPLATE_SRC="/docker_nginx/ssl.conf.template"
HTTP_DEST="$NGINX_CONF_DIR/default.conf"
SSL_DEST="$NGINX_CONF_DIR/ssl.conf"

CERT_DIR="/etc/letsencrypt/live/agorachain.es"
FULLCHAIN="$CERT_DIR/fullchain.pem"
PRIVKEY="$CERT_DIR/privkey.pem"
RELOAD_MARKER="/var/www/certbot/reload_nginx"
SPRING_IP="${SPRING_PRIVATE_IP:-127.0.0.1}"

if [ -f "$HTTP_SRC" ]; then
  sed "s/@@SPRING_PRIVATE_IP@@/${SPRING_IP}/g" "$HTTP_SRC" > "$HTTP_DEST"
fi

# Coge HTTP para que sirva ACME challenges
nginx

echo "Nginx arrancado. Esperando certificados en $CERT_DIR..."

while :; do
  # Aparece certificado so desplegar SSL y habilitar redireccion 80 a 443
  if [ -f "$FULLCHAIN" ] && [ -f "$PRIVKEY" ]; then
    if [ ! -f "$SSL_DEST" ]; then
      echo "Certificados detectados. Aplicando configuración SSL..."
      if [ -f "$SSL_TEMPLATE_SRC" ]; then
        sed "s/@@SPRING_PRIVATE_IP@@/${SPRING_IP}/g" "$SSL_TEMPLATE_SRC" > "$SSL_DEST"
      else
        echo "Plantilla SSL no encontrada en $SSL_TEMPLATE_SRC"
      fi

      # Replace la conf HTTP por la version que redirige
      if [ -f "$HTTP_REDIRECT_SRC" ]; then
        cp "$HTTP_REDIRECT_SRC" "$HTTP_DEST"
      else
        echo "Plantilla HTTP con redirección no encontrada en $HTTP_REDIRECT_SRC"
      fi

      nginx -s reload || echo "Warning: fallo al recargar nginx"
      echo "SSL habilitado y HTTP ahora redirige a HTTPS (/.well-known sigue accesible)."
    fi
  fi

  if [ -f "$RELOAD_MARKER" ]; then
    echo "Marker de renovación detectado: recargando nginx..."
    nginx -s reload || echo "Warning: fallo al recargar nginx tras renovación"
    rm -f "$RELOAD_MARKER" || true
    echo "Recarga completada y marker borrado."
  fi

  sleep 5
done