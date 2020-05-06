#!/bin/zsh

docker volume create mongodb-data 2>&1 >/dev/null
docker run -it -p 8888:8888 -v mongodb-data:/data msteams-ctfbot:latest
