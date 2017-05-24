FROM node:7-alpine

COPY package.json /app/package.json

WORKDIR /app

RUN npm install

COPY . /app

COPY docker/translations.json /translations.json

EXPOSE 80

ENTRYPOINT ["docker/entrypoint.sh"]
