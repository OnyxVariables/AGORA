FROM node:24.12.0-alpine

WORKDIR /agora

COPY ./frontendReact/agora-react/package*.json ./
RUN npm install

COPY ./frontendReact/agora-react/ ./
RUN npm run build
