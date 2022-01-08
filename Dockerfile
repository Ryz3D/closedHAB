FROM node:16
WORKDIR /usr/src/closedhab
COPY . .
RUN npm i
EXPOSE 8087
CMD [ "node", "main.js" ]
