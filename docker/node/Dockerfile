FROM node:24.12.0-alpine

WORKDIR /agora

COPY ./frontend/package*.json ./

# Keep Cypress as a dev dependency for local tests, but skip downloading its heavy binary in image builds.
ENV CYPRESS_INSTALL_BINARY=0

# Force install esbuild for alpine/linux platform
RUN npm install && npm rebuild esbuild --platform=linux --arch=x64 --force

COPY ./frontend/ ./

# Vite inlines VITE_* at build time; pass via compose build.args
ARG VITE_AUTH_URL
ARG VITE_API_URL
ARG VITE_SPRING_HTTP_URL
ARG VITE_SPRING_WS_URL
ARG VITE_VOTATIONS_ADMIN_TOKEN
ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SPRING_HTTP_URL=$VITE_SPRING_HTTP_URL
ENV VITE_SPRING_WS_URL=$VITE_SPRING_WS_URL
ENV VITE_VOTATIONS_ADMIN_TOKEN=$VITE_VOTATIONS_ADMIN_TOKEN

RUN npm run build