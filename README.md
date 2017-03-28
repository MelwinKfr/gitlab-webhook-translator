# Minimal Gitlab companion
Just a tiny web server based on [Express](http://expressjs.com)
to translate Gitlab web hooks body to the wanted format.

You'll be able to generate the URL you want with the body you expect
at the appropriate moment.

## Configuration
Configuration file is located at `/translations.json`

Explanation in code:
```json
{"translations": [
  {
    "token": "Your_Secret_Gitlab_Token",
    "method": "GET",
    "url": "https://my-service.com/route/with/:gitlab.body.attribute",
    "condition": "gitlab.body.attribute == 'test'"
  },
  {
    "token": "Another_Secret_Gitlab_Token",
    "method": "POST",
    "url": "https://my-service.com/another/route/:gitlab.body.attribute",
    "body": {
      "new-attribute": "gitlab.body.attribute",
      "new-object": {
        "another-attribute": "gitlab.body.another.attribute"
      }
    }
  }
]}
```

## Run it
    $ docker run -d --name gitlab-wht-companion \
        -v /hots/conf.json:/translations.json \
        melwinkfr/gitlab-webhook-translator

    $ docker run --link gitlab-wht-companion gitlab/gitlab-ce

## Use it
Go to your Gitlab project Settings > Integrations to create a new trigger.
Use `http://gitlab-wht-companion` as URL and create your trigger as usual.
Then use the configuration file to create a new translation.

Here is a working configuration example used to trigger a build
on merge request events within the same project:
```json
{"translations": [
  {
    "token": "superXsecretXtoken",
    "method": "GET",
    "url": "https://git.example.com//api/v4/projects/:object_attributes.source_project_id/ref/:object_attributes.source_branch/trigger/pipeline?token=3d4e9e3139c73a6be30bece40bd3e8",
    "condition": "object_attributes.work_in_progress == false"
  }
]}
```
