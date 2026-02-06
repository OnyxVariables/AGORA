FROM nginx:1.28.1-alpine

RUN apk add --no-cache openssl

# plantillas y script de arranque dentro de la imagen
COPY ./docker/nginx/http.conf /docker_nginx/http.conf
COPY ./docker/nginx/http_redirect.conf /docker_nginx/http_redirect.conf
COPY ./docker/nginx/ssl.conf.template /docker_nginx/ssl.conf.template
COPY ./docker/nginx/start.sh /start.sh
RUN chmod +x /start.sh

ENTRYPOINT ["/start.sh"]

EXPOSE 80 443
