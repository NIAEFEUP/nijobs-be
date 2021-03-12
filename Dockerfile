# Development dockerfile
FROM node:14.13.1

WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json ./

# Install Node Packages
RUN npm install

# Copying self-signed certs
COPY certs/ certs/

# Generate certs
RUN cd certs && ./certgen.sh && cd ..

# Copying app source
COPY src/ src/

# Copying jest mocks
COPY __mocks__/ __mocks__/

# Copying test suite
COPY test/ test/

# Copying .env files
COPY .env* ./

# Copying babel config
COPY .babelrc ./

CMD ["npm", "start"]
