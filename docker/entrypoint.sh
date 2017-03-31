#!/bin/sh

if [ "$NODE_ENV" = "dev" ]; then
    nodemon;
else
    npm start;
fi
