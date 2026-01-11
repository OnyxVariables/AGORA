FROM certbot/certbot:v5.2.2

COPY ./docker/certbot/setup.sh /setup.sh
RUN chmod +x /setup.sh

ENTRYPOINT ["/setup.sh"]
