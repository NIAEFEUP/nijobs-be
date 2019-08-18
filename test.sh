#!/usr/bin/env sh

PORT=3001 docker-compose up --exit-code-from test "$1" test
