FROM nginx:1.28.1-alpine

RUN apk add --no-cache openssl

#RUN mkdir -p /etc/letsencrypt/live/agorachain.es
#
#COPY ./docker/nginx/certs/fullchain.pem /etc/letsencrypt/live/agorachain.es/fullchain.pem
#COPY ./docker/nginx/certs/privkey.pem /etc/letsencrypt/live/agorachain.es/privkey.pem

COPY ./docker/nginx/default.conf /etc/nginx/conf.d/default.conf
# COPY ./docker/nginx/setup.sh ./
# RUN chmod +x  ./setup.sh

# ENTRYPOINT ["./setup.sh"]
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80 443
