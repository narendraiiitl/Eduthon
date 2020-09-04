FROM alpine:latest

# Server deps
RUN apk add nodejs npm bash make grep

# User programs
RUN apk add gcc g++ python3 git

COPY package.json /server/

WORKDIR /server/

RUN npm i

COPY app.js /server/

ARG USER=user11
ARG UID=111
ARG GID=111
ARG PW=passgbcibeli
ENV UID=${UID}

RUN adduser --disabled-password -u ${UID} ${USER}

# Copy addon files
COPY image-addon-files/.bashrc /home/${USER}/

USER ${UID}:${GID}

ENTRYPOINT node app.js