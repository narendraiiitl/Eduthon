FROM node:12-alpine

COPY index.js /server/
COPY config.js /server/
COPY package.json /server/

WORKDIR /server/

RUN apk add build-base linux-headers make python2

RUN npm i

ENTRYPOINT npm start
