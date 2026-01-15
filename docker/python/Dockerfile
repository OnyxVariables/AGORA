FROM python:3.13-alpine AS generator

WORKDIR /data

COPY ./tools/ ./
RUN pip install --no-cache-dir -r ./requirements.txt
RUN python3 ./populate_db.py

FROM mariadb:11.8.5-noble AS loader
COPY --from=generator /data/insert.sql ./insert.sql

COPY ./docker/python/load.sh ./load.sh
RUN chmod +x ./load.sh

ENTRYPOINT ["./load.sh"]
