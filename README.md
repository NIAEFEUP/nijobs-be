# niJobs - BackEnd


[![Build Status](https://img.shields.io/travis/NIAEFEUP/nijobs-be/develop.svg?style=for-the-badge)](https://travis-ci.org/NIAEFEUP/nijobs-be)
[![GitHub issues](https://img.shields.io/github/issues/NIAEFEUP/nijobs-be.svg?style=for-the-badge)](https://github.com/NIAEFEUP/nijobs-be/issues)
[![GitHub license](https://img.shields.io/github/license/NIAEFEUP/nijobs-be.svg?style=for-the-badge)](https://github.com/NIAEFEUP/nijobs-be/blob/master/LICENSE)


A platform for companies to advertise their job opportunities to the students.

Made with ❤️ by NIAEFEUP.

## Installation

### Prerequisites

- [`Docker`](https://www.docker.com)
- [`Docker Compose`](https://www.docker.com)

### Installing Docker

The best approach to install `docker` is to follow the offical guide [here](https://docs.docker.com/install/linux/docker-ce/ubuntu/#install-using-the-repository). 

Please follow the steps in `Install using the repository` section.

Next, follow [these](https://docs.docker.com/install/linux/linux-postinstall/) steps to configure docker access with non sudo permissions in the `Manage Docker as a non-root user` section.

### Installing Docker Compose

The best approach to install `docker-compose` is to follow the offical guide [here](https://docs.docker.com/compose/install/#install-compose). 

## Usage

### Development
To start developing, you must create a file `.env` with environment variables, which are explained in more detail [below](#env-file-specification).

After creating the `.env` file, you must build a dev server.

```bash
docker-compose build
```
If you have already built the images/containers before you can simply run:
```bash
docker-compose up
```

> A `dev.sh` file is available in the project's root folder to run these commands on linux environments (simply run `./dev.sh [--build]`)

This will create a development server with hot reloading which will listen on `http://localhost:<HOST_PORT>`.

### Testing (TOCHANGE)

To run the test suite, the workflow is similar to the development one.

```bash
./test.sh --build 
```
If you have already built the images/containers before you can simply run:

```bash
./test.sh 
```
> The `test.sh` file is available in the project's root folder

### Production Environment (TOCHANGE)

The production environment is created by doing:

```bash
./prod.sh --build 
```
If you have already built the images/containers before you can simply run:

```bash
./prod.sh 
```
> The `prod.sh` file is available in the project's root folder

This environment doesn't have hot reloading and is made to be used in the main server which is running this aplication.

### Env File Specification

- `HOST_PORT`= The port that the back-end server will expose (http://localhost:<HOST_PORT>)
- `CONTAINER_PORT`= The port where the app will run inside the container (Can be the same as `HOST_PORT`)
- `MONGO_URI`= [Optional] Specify a URI for an external mongo database

## Project Details

This project uses [`Node.js`](https://nodejs.org/en/) with [`Express.js`](https://expressjs.com/) for the API routing and request-response logic. The DBMS used is [`MongoDB`](https://www.mongodb.com/), along with [`Mongoose`](https://mongoosejs.com/) for the communication to it in Node.

Testing is done using [`Mocha`](https://mochajs.org/) and [`Chai`](https://www.chaijs.com/).

### Project Structure

```
.
├── test :: Unit tests
└── src :: Source code
    ├── actions :: Redux Actions
    ├── components :: General React Components
    │   └── HomePage :: Example folder for components used in specific page
    ├── pages :: Page Components
    └── reducers :: Redux Reducers

```

## License
[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)
