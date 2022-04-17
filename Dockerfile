# syntax=docker/dockerfile:1
FROM node:16
ENV NODE_ENV=production
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production

# Bundle app source
COPY . .

EXPOSE 9999
CMD [ "node", "server/main.js","127.0.0.1","9999", "MapData.js" ]
