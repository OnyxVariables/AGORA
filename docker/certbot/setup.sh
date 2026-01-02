#!/bin/sh

DOMAINS="-d newagora.es"
EMAILS="newagora@gmail.com"

if [ ! -d "/etc/letsencrypt/live/newagora.es" ]; then
	certbot certonly \
		--webroot \
		--webroot-path=/var/www/certbot \
		--email $EMAILS \
		--agree-tos \
		--no-eff-email \
		$DOMAINS
fi
