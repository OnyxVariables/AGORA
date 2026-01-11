FROM mariadb:11.8.5-noble

# https://hub.docker.com/_/mariadb#initializing-the-database-contents
WORKDIR /docker-entrypoint-initdb.d/

COPY db .

EXPOSE 3306
