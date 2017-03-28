#!/bin/bash

docker build -f docker/Dockerfile -t wht .
docker run -d --name wht -e NODE_ENV=dev -e VIRTUAL_HOST="~^wht\..*\.xip\.io" -v $(pwd):/app wht nodemon start
docker logs -f wht
