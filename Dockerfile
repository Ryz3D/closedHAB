FROM node:16
WORKDIR /usr/src/closedhab
COPY . .
RUN npm i
CMD [ "sudo", "node", "main.js" ]
EXPOSE 8087
 