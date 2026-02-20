FROM node:24.12.0-alpine

WORKDIR /agora

COPY ./frontend/package*.json ./
RUN npm install

COPY ./frontend/ ./
RUN npm run build
