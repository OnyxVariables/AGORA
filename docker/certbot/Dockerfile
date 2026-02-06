FROM certbot/certbot:v5.2.2

COPY start.sh /etc/certbot/start.sh
RUN chmod +x /etc/certbot/start.sh

ENTRYPOINT ["/etc/certbot/start.sh"]