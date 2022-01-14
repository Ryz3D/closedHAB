FROM node:16
WORKDIR /usr/src/closedhab
COPY . .
RUN npm i
RUN curl -fsSLO https://download.docker.com/linux/static/stable/x86_64/docker-20.10.12.tgz \
    && tar xzvf docker-20.10.12.tgz --strip 1 -C /usr/bin/docker docker/docker \
    && rm docker-20.10.12.tgz
CMD [ "node", "main.js" ]
