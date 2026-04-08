FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN apk add --no-cache curl

COPY . .

RUN chmod +x deploy.sh

EXPOSE 8545

CMD ["sh", "deploy.sh"]
