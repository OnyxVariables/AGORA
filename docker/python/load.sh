#!/bin/sh

until mariadb -h db -u $DB_USERNAME -p$DB_PASSWORD -e "SELECT 1"; do
    sleep 2;
done &&
mariadb -h db -u $DB_USERNAME -p$DB_PASSWORD $DB_DATABASE < insert.sql
mariadb -h db -u $DB_USERNAME -p$DB_PASSWORD $DB_DATABASE < 14-province-seats.sql
