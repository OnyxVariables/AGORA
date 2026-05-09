FROM certbot/certbot:v5.2.2

# La imagen oficial no garantiza curl; start.sh lo usa para esperar a nginx (ACME HTTP-01).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY start.sh /etc/certbot/start.sh
RUN chmod +x /etc/certbot/start.sh

ENTRYPOINT ["/etc/certbot/start.sh"]