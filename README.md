# Minimal Gitlab companion
Just a tiny web server based on [Express](http://expressjs.com)
to translate Gitlab web hooks body to the wanted format.

You'll be able to generate the URL you want with the body you expect
at the appropriate moment.

> This project is designed to be run as a
[Docker](https://www.docker.com/) container.

## Configuration
Configuration is stored as a JSON file which is
located at `/translations.json`.

### Full example
```json
{"translations": [
  { // Comments are authorized
    "name": "to_identify_the_translation_inside_logs",
    "token": "Your_Secret_Gitlab_Token",
    "target": {
        "method": "POST",
        "protocol": "https",
        "host": "my-service.com",
        "port": 443,
        "path": "/another/route/:gitlab.body.attribute?token='xyz'"
    },
    "body": {
      "new-attribute": ":gitlab.body.attribute",
      "new-object": {
        "another-attribute": ":gitlab.body.another.attribute"
      },
      "another-object": ":gitlab.body.object",
      "original-data": ":__original-data__"
    },
    "condition": ":gitlab.body.attribute === 'test'"
  }
]}
```
### Attributes
- `name`: Allow you to easily spot your translation inside  logs.
- `token`: Optional, used to filter translations. It is compared with header `"X-Gitlab-Token"`.
- `condition`: Optional, used to filter translations. It must be a correct Javascript if statement's condition.
- `target`: Required object to define the targeted service.
    - `method`: A string specifying the HTTP request method. Defaults to `"GET"`.
    - `protocol`: Defaults to `"http"`. You can choose between `http` or `https`.
    - `host`: A domain name or IP address of the server to issue the request to.
    - `port`: Port of targeted server. Defaults to `80` or `443` according to used protocol (`http` or `https`).
    - `path`: Request path. Defaults to `"/"`.
- `body`: Will be the `application/json` encoded body of the outgoing request.

### Variables
You can use variables to translate the incoming request into the appropriate outgoing format.
To do so, just use add `":"` before a valid attribute contained 
by the `application/json` encoded body of the incoming request.

Variables are not available in every fields, just inside: `condition`, `target.path`, `body.*`.
Inside `body` attribute, you can use objects as variable.

If you want to keep the entire body of of the incoming request,
use the keyword `":__original-data__"` (only available in `body` attribute).

## Run it
    $ docker run -d \
        --name gitlab-wht-companion \
        -v /hots/conf.json:/translations.json \
        melwinkfr/gitlab-webhook-translator

    $ docker run \
        --link gitlab-wht-companion \
        gitlab/gitlab-ce

## Use it
Go to your Gitlab project Settings > Integrations to create a new trigger.
Use `http://gitlab-wht-companion` as URL and create your trigger as usual.
Then use the configuration file to create a new translation.

Here is a working configuration example used to trigger a build
on merge request events within the same project:
```json
{"translations": [
  {
    "target": {
        "method": "GET",
        "protocol": "https",
        "host": "git-example.com",
        "path": "/api/v4/projects/:object_attributes.source_project_id/ref/:object_attributes.source_branch/trigger/pipeline?token=3d4e9e3139c73a6be30bece40bd3e8"
    },
    "condition": ":object_attributes.work_in_progress === false"
  }
]}
```
