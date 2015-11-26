'use strict';

var URL = require('url');
var stream = require('stream');
var querystring = require('querystring');

var DEFAULT_OPTIONS = {
  defaults: {},
  wait: false,
};
var MAX_TEXT_LENGTH = 4000;

function merge() {
  var target, argument;
  for (var i = 0; (argument = arguments[i]); i++) {
    if (i === 0) {
      target = argument;
      continue;
    }
    Object.keys(argument).forEach(function (key) {
      if (!argument.hasOwnProperty(key)) { return; }
      target[key] = argument[key];
    });
  }
  return target;
}
function clone(object) {
  return merge({}, object);
}
function noop() {}

function MattermostStream(webhookURL, options) {
  if (!webhookURL) throw new Error('webhookURL argument required but not supplied');
  var url = URL.parse(webhookURL);
  options = merge({}, DEFAULT_OPTIONS, options);

  if (options.wait === true) options.wait = 200;

  var http = require(url.protocol.toLowerCase().replace(':', ''));

  var streamObject;

  var waitBuffer = [];
  var waitTimeout;
  var waitLength = 0;

  function send(object, next) {
    next = next || noop;

    var payload;
    if (Buffer.isBuffer(object) || typeof object !== 'object') {
      payload = clone(options.defaults);
      payload.text = object;
    } else {
      payload = merge({}, options.defaults, object);
    }

    if (payload.text === undefined || payload.text === null) {
      next(new Error('Trying to send a payload without a "text" property'));
      return;
    }
    payload.text = '' + payload.text;

    var postData = querystring.stringify({
      payload: JSON.stringify(payload),
    });
    var requestOptions = clone(url);
    requestOptions.method = 'POST';
    requestOptions.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length,
    };

    var req = http.request(requestOptions, function (res) {
      if (res.statusCode !== 200) {
        streamObject.emit('error', new Error('Unexpected status code: ' + res.statusCode));
        return;
      }
      next();
    });
    req.on('error', function (e) { streamObject.emit('error', e); });
    req.write(postData);
    req.end();
  }

  var writeStream = new stream.Writable({
    objectMode: !options.wait,
    write: function (object, encoding, next) {
      streamObject = this;
      if (options.wait) {
        clearTimeout(waitTimeout);

        if (waitLength + object.length >= MAX_TEXT_LENGTH) {
          waitBuffer.push(object.toString().slice(0, MAX_TEXT_LENGTH - waitLength));
          send(waitBuffer.join(''));
          waitBuffer = [];
          waitLength = 0;
          object = object.slice(MAX_TEXT_LENGTH - waitLength);
        }

        waitBuffer.push(object);
        waitLength += object.length;

        waitTimeout = setTimeout(function () {
          send(waitBuffer.join(''));
          waitBuffer = [];
          waitLength = 0;
        }, options.wait);
        next();
      } else {
        send(object, next);
      }
    },
  });

  return writeStream;
}

module.exports = MattermostStream;
