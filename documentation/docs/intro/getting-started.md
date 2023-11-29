---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
slug: /intro/getting-started
---

## Installation

(The following methods use Docker and Docker Compose. You can also develop directly using Node and MongoDB installed directly on your computer, but using containers ensures a more consistent configuration.)

### Prerequisites

- [`Docker`](https://www.docker.com)
- [`Docker Compose`](https://www.docker.com)

### Installing Docker

The best approach to install `docker` is to follow the official guide [here](https://docs.docker.com/install/linux/docker-ce/ubuntu/#install-using-the-repository). 

Please follow the steps in `Install using the repository` section.

Next, follow [these](https://docs.docker.com/install/linux/linux-postinstall/) steps to configure docker access with non sudo permissions in the `Manage Docker as a non-root user` section.

### Installing Docker Compose

The best approach to install `docker-compose` is to follow the official guide [here](https://docs.docker.com/compose/install/#install-compose).

### Env files setup

To start developing, copy `.env` to `.env.local` (by running `cp .env .env.local`).

`.env.local` (the file you just created) is your local configuration file, in which you should override the default configurations provided by `.env`.

Then, you can override the variable's values, according to their explanation in `.env`.

Whenever the file is updated, the server needs to be restarted for changes to have effect.


### Cors Setup

In order to allow requests from multiple clients, an array of URL's or regexes can be defined by `ACCESS_CONTROL_ALLOW_ORIGINS`. This is an important step regarding connecting the frontend and the backend of the project. It is crucial that all URL's have no trailing `/`. Example:

```
ACCESS_CONTROL_ALLOW_ORIGINS=["https:\/\/localhost:3000", "https:\\/\\/deploy-preview-\\d+--nijobs\\.netlify\\.app", "https://nijobs.netlify.app"]
```

## Usage

After [setting up your env files](#env-files-setup), you can run the project:

### Development Environment

You can start developing by building a local server:

```bash
docker-compose build web-dev
```

If you have already built the images/containers before you can simply run:

```bash
docker-compose up web-dev
```

> A `dev.sh` file is available in the project's root folder to run these commands on linux environments (simply run `./dev.sh [--build]`)

This will create a development server with hot reloading which will listen on `http://localhost:<PORT>`.

### Testing Environment

To run the test suite (mostly for CI/CD use), the workflow is similar to the development one:

```bash
docker-compose build test
```
After building the images/containers, the tests can be run with:

```bash
docker-compose up --exit-code-from test test
```
> A `test.sh` file is available in the project's root folder to run these commands on linux environments (simply run `./test.sh [--build]`)

### Production Environment

The production environment can be created by doing:

```bash
docker-compose build web-prod
```
If you have already built the images/containers before you can simply run:

```bash
docker-compose up web-prod
```
> A `prod.sh` file is available in the project's root folder to run these commands on linux environments (simply run `./prod.sh [--build]`)

This environment doesn't have hot reloading or dev extensions and is made to be used in the deployment server running this application.

### Manual Configuration (Recommended for flexibility)

> In order to install and manage versions for `nodejs`, the usage of a version manager such as [`asdf`](https://asdf-vm.com/) (very recommended) or [`nvm`](https://github.com/nvm-sh/nvm) (still decent, but limited to `node`).

If you already have a `node` installation you can simply use the `npm` commands specified in `package.json` directly.

So, you can run:

- `npm start` to run the application in development mode, with hot reloading
- `npm test` to run the test suites
- `npm run prod` to serve the development version of the project
- Other `npm run` scripts configured in `package.json` (such as linting, for example)

This approach might be the least straightforward to set up but is the most flexible as you can freely and directly interact with the runtime of the application.

#### HTTPS details
In order for Cookies to work correctly, we need to use HTTPS in development, so that we can use local servers to test frontend changes in netlify.

If you use Docker, the certs will be automatically generated and used. If you are running npm directly, you should run `./certs/certgen.sh` so that it generates the required files.

On the first usage, you might get security alerts due to it being self-signed, you just need to go to some endpoint (like https://localhost:8087) and allow your browser to visit it.

## Project Details

This project uses [`Node.js`](https://nodejs.org/en/) with [`Express.js`](https://expressjs.com/) for the API routing and request-response logic. The DBMS used is [`MongoDB`](https://www.mongodb.com/), along with [`Mongoose`](https://mongoosejs.com/) for integrating it with Node.

Testing is done using [`Jest`](https://jestjs.io/) and [`Supertest`](https://github.com/visionmedia/supertest).

### Project Concepts Map

![Project Concepts Map](https://imgur.com/HVXk1Jg.png)
> [Source](https://app.creately.com/diagram/Kfsc8WeFzKe/edit)

### Project Structure

- `src/`
    - `api/`
        - `routes/` - Methods that register endpoints for the app
        - `middleware/` - Application middleware. For example validators go here
    - `lib/` - Supporting code
    - `loaders/` - Modules responsible for the startup process
    - `models/` - Database entity models (Mongoose models)
    - `services/` - Business logic for the controllers
    - `config/` - Application configurations (settings, authentication, etc.)
        - `env.js` - Environment variables and related configurations
    - `index.js` - App entry point
- `test/` - Self explanatory: Unit tests, functional (end-to-end) tests, etc.
