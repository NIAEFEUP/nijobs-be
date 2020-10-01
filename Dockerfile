# Development dockerfile
FROM node:12.18.4

WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json ./

# Install Node Packages
RUN npm install

# Copying app source
COPY src/ src/

# Copying test suite
COPY test/ test/

# Copying .env files
COPY .env* ./

CMD ["npm", "start"]
