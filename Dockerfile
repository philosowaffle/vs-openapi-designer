FROM linuxserver/code-server

RUN apt install -y nodejs npm
RUN npm config set unsafe-perm=true
RUN npm install -g yo generator-code vsce

RUN apt-get clean

EXPOSE 8443