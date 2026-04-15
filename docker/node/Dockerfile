FROM node:24.12.0-alpine

WORKDIR /agora

COPY ./frontend/package*.json ./

# Force install esbuild for alpine/linux platform
RUN npm install && npm rebuild esbuild --platform=linux --arch=x64 --force

COPY ./frontend/ ./

# Vite inlines VITE_* at build time; pass via compose build.args
ARG VITE_AUTH_URL
ARG VITE_API_URL
ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build
