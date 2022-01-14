FROM node:16
ENV DOCKERVERSION=20.10.12
WORKDIR /usr/src/closedhab
COPY . .
RUN npm i
RUN apt install curl tar
RUN curl -fsSLO https://download.docker.com/linux/static/stable/x86_64/docker-20.10.12.tgz \
    && tar xzvf docker-${DOCKERVERSION}.tgz --strip 1 -C /usr/local/bin ./docker \
    && rm docker-${DOCKERVERSION}.tgz
CMD [ "node", "main.js" ]
