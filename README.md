# mattermost-stream

Use a Mattermost webhook as a writable node.js stream

```js
const MattermostStream = require('mattermost-stream');
let stream = MattermostStream('https://mm.example.com/hooks/abcd1234');
stream.write('This will show up in the Mattermost chat.');
```

## Usage

### `MattermostStream(webhookURL[, options ])`

Returns a new writable stream will make POST requests to the specified
`webhookURL`. The optional `options` argument accepts the following options:

* `defaults`: A template object that will be used for each request. The defaults
  will be overwritten by anything that you pass to `stream.write()`.

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
const MattermostStream = require('mattermost-stream');
const URL = 'https://mm.example.com/hooks/abcd1234';

let stream = new MattermostStream(URL);
stream.write('This will show up in the Mattermost chat.');
stream.write({
  text: 'This message will appear to come from octocat.',
  username: 'octocat' });

let cookieMonster = new MattermostStream(URL,
  { defaults: { username: 'Cookie Monster' } });
cookieMonster.write('Me like cookies!');
cookieMonster.write({ text: 'I don\'t like cookies.',
  username: 'Probably Not Cookie Monster' })
```
