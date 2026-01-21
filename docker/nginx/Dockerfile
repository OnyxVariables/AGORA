FROM nginx:1.28.1-alpine

RUN apk add --no-cache openssl

COPY ./docker/nginx/default.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80 443
