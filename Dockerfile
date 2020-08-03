FROM node:8

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json /app/

# Install nodemon globally
RUN npm install nodemon -g

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . /app

EXPOSE 4000

CMD [ "npm", "run" , "debug" ]