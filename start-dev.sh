#!/bin/bash

name="gitlab-webhook-translator"

# Build containers
docker build -f Dockerfile -t wht .
docker build -f docker/Dockerfile-dev -t wht-dev .

# Stop and remove old instance
docker stop ${name} && docker rm ${name}

# Create configuration if needed
home=~
localpath="${home}/docker/${name}/"
filename="translations.json"
if [ ! -f ${localpath}${filename} ]; then
    mkdir -p ${localpath}
    touch ${localpath}${filename} && cp ./docker/translations.json ${localpath}${filename}
    echo "Config file created at ${localpath}${filename}"
fi

# Run service
docker run -d --name ${name} -e NODE_ENV=dev \
-v ~/docker/${name}/translations.json:/translations.json \
-e VIRTUAL_HOST="~^wht\..*\.xip\.io" \
-v $(pwd):/app \
wht-dev \
nodemon start

echo ""
echo "######################################################"
echo "Useful dev commands:"
echo "attach logs:  docker logs -f ${name}"
echo "restart:      docker restart ${name}"
echo "######################################################"
echo ""

# Attach logs
docker logs -f ${name}
