FROM certbot/certbot:v5.2.2

# Imagen certbot oficial v5 = Alpine (apk), no Debian (apt-get).
# curl: espera a nginx en start.sh antes del HTTP-01 de Let's Encrypt.
RUN apk add --no-cache curl

COPY start.sh /etc/certbot/start.sh
RUN chmod +x /etc/certbot/start.sh

ENTRYPOINT ["/etc/certbot/start.sh"]