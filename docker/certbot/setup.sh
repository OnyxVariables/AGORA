#!/bin/sh

DOMAINS="-d agorachain.es"
EMAILS="agorachain@gmail.com"

if [ ! -d "/etc/letsencrypt/live/agorachain.es" ]; then
	certbot certonly \
		--webroot \
		--webroot-path=/var/www/certbot \
		--email $EMAILS \
		--agree-tos \
		--no-eff-email \
		$DOMAINS
fi
