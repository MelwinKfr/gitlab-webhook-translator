#!/bin/sh

if [ "$NODE_ENV" = "dev" ]; then
    npm install -g nodemon;
    nodemon;
else
    npm start;
fi
