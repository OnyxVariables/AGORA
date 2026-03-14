FROM node:24.12.0-alpine

WORKDIR /agora

COPY ./frontend/package*.json ./

# Force install esbuild for alpine/linux platform
RUN npm install
RUN npm rebuild esbuild --platform=linux --arch=x64 --force

COPY ./frontend/ ./
RUN npm run build
