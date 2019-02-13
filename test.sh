#!/usr/bin/env sh

HOST_PORT=3000 docker-compose up --exit-code-from test $1 test mongo