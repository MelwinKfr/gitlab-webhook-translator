#!/bin/bash
EXPOSE_PORT=$1
if [ ! -z "$EXPOSE_PORT" ]; then
  EXPOSE_CMD="-p $EXPOSE_PORT:80"
fi

name="gitlab-webhook-translator"

# Install dev dependencies
docker run --rm -it -v $(pwd):/app -w /app node npm install

# Build containers
if [[ "$(docker images -q wht 2> /dev/null)" == "" ]]; then
  docker build -t wht .
fi
docker build -f docker/Dockerfile-dev -t wht-dev .

# Stop and remove old instance
docker stop ${name} && docker rm ${name}

# Create configuration if needed
localpath="${HOME}/docker/${name}/"
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
$EXPOSE_CMD \
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
