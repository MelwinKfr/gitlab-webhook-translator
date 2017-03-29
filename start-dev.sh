#!/bin/bash

name='gitlab-webhook-translator'

docker build -f docker/Dockerfile -t ${name} .
docker stop ${name} && docker rm ${name}
docker run -d --name ${name} -e NODE_ENV=dev -e VIRTUAL_HOST="~^wht\..*\.xip\.io" -v $(pwd):/app ${name} nodemon start
docker logs -f ${name}
