# Slackstream

Pipe things into Slack or Mattermost.

Can be used [as a module](#usage-module) or [on the command line](#usage-cli).

```js
const slackstream = require('slackstream');
let stream = slackstream('https://mm.example.com/hooks/abcd1234');
stream.write('This will show up in Slack or Mattermost.');
```

## Usage (Module)

### `slackstream(webhookURL[, options ])`

Returns a new writable stream that will make POST requests to the specified
`webhookURL`. The optional `options` argument accepts the following options:

* `defaults`: *(Object)* A template object that will be used for each request.
  The defaults will be overwritten by anything that you pass to `stream.write()`.
* `wait`: *(Integer|Boolean)* Do not send requests immediately on
  `stream.write()`, instead input will be buffered until no writes have occurred
  for the specified number of milliseconds (defaults to 200ms if passed `true`
  instead of an integer). Input will be sent immediately once it reaches
  Mattermost's limit of 4000 characters.  
  **Note:** This option will disable *object mode*. The stream will emit an
  error if you try to write an object. Buffers and strings work as expected
  and will be joined together when the input is eventually sent.

### `stream.write(payload)`

Sends `payload` to the `webhookURL` specified when the stream was created.

`payload` can be an object, in which case it will be used as the payload, or
anything else, in which case it will be stringified and used as the payload's
`text` property.

`payload.text` must be set and will always be stringified. All other properties
of payload will be used as they are.

Default values for the payload can be specified when the stream is first
created.

### Example

```js
const slackstream = require('slackstream');
const URL = 'https://mm.example.com/hooks/abcd1234';

let stream = slackstream(URL);
stream.write('This will show up in Slack or Mattermost.');
stream.write({
  text: 'This message will appear to come from octocat.',
  username: 'octocat' });

let cookieMonster = slackstream(URL,
  { defaults: { username: 'Cookie Monster' } });
cookieMonster.write('Me like cookies!');
cookieMonster.write({ text: 'I don\'t like cookies.',
  username: 'Probably Not Cookie Monster' })
```


## Usage (CLI)

```sh
npm install -g slackstream
echo "Hello world" | slackstream http://mm.example.com/hooks/abcd1234 \
  --defaults.username octocat \
  --defaults.channel town-square
```
