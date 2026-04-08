FROM node:24.12.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN apk add --no-cache curl

COPY contracts/ ./contracts/
COPY scripts/ ./scripts/
COPY deploy.sh .
COPY hardhat.config.js .

RUN chmod +x deploy.sh

EXPOSE 8545

CMD ["sh", "deploy.sh"]
