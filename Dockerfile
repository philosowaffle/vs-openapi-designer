FROM linuxserver/code-server

RUN apt-get update \
    && apt-get upgrade -y
RUN apt install -y nodejs npm \
    && npm config set unsafe-perm=true \
    && npm install -g yo generator-code vsce \
    && apt-get clean

EXPOSE 8443