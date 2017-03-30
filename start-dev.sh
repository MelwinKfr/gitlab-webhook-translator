#!/bin/bash

name="gitlab-webhook-translator"

docker build -f docker/Dockerfile -t ${name} .
docker stop ${name} && docker rm ${name}

home=~
localpath="${home}/docker/${name}/"
filename="translations.json"

if [ ! -f ${localpath}${filename} ]; then
    mkdir -p ${localpath}
    touch ${localpath}${filename} && cp ./docker/translations.json ${localpath}${filename}
    echo "Config file created at ${localpath}${filename}"
fi

docker run -d --name ${name} -e NODE_ENV=dev \
-v ~/docker/${name}/translations.json:/translations.json \
-e VIRTUAL_HOST="~^wht\..*\.xip\.io" \
-v $(pwd):/app ${name} \
nodemon start

docker logs -f ${name}
