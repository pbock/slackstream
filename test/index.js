'use strict';

const express = require('express');
const expect = require('chai').expect;

// Middleware
const bodyParser = require('body-parser');

const PORT = 10119;

const MattermostStream = require('..');

describe('MattermostStream', function () {
  it('is a function', () =>
    expect(MattermostStream).to.be.a('function'));
  it('requires a URL as its first argument', function () {
    expect(() => MattermostStream()).to.throw();
    expect(() => MattermostStream('http://example.com')).to.not.throw();
  });
  it('returns a writable stream', () =>
    expect(MattermostStream('http://example.com')).to.be.an.instanceof(require('stream')));
});

describe('stream.write()', function () {
  let requestCallback, stream;
  let localURL = 'http://localhost:' + PORT;
  before(function (done) {
    let app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.post('/', function (req, res) {
      requestCallback(JSON.parse(req.body.payload), req);
      res.sendStatus(200);
    });
    app.post('/status/:code', function (req, res) {
      res.sendStatus(+req.params.code);
    });

    app.listen(PORT, done);
  });

  beforeEach(function () {
    requestCallback = null;
    stream = MattermostStream(localURL);
  });

  it('POSTs a JSON payload to the specified URL', function (done) {
    let object = { text: 'foo', otherStuff: [ 0, 'bar', new Date() ] };
    requestCallback = function (payload, req) {
      expect(req.body).to.contain.keys('payload');
      expect(req.body.payload).to.be.a('string');
      expect(() => JSON.parse(req.body.payload)).to.not.throw();
      done();
    }
    stream.write(object);
  });

  it('stringifies the "text" property', function (done) {
    let object = { text: 0, number: 1 };
    requestCallback = function (payload) {
      expect(payload.text).to.equal('0');
      expect(payload.text).to.be.a('string');
      expect(payload.number).to.equal(1);
      done();
    }
    stream.write(object);
  });

  it('emits HTTP request error events', function (done) {
    let stream = MattermostStream('http://thisurldoesnotexist');
    stream.on('error', function (e) {
      expect(e.code).to.equal('ENOTFOUND');
      done();
    });
    stream.write('');
  });

  it('emits an error event when the response status code is not 200', function (done) {
    let stream = MattermostStream(localURL + '/status/401');
    stream.on('error', function (e) {
      expect(e.message).to.contain('401');
      done();
    });
    stream.write('');
  });

  it('emits an error event when trying to send a payload without a text', function (done) {
    stream.on('error', function (e) {
      expect(e.message).to.contain('text');
      done();
    });
    stream.write({});
  });

  describe('when called with a string', function () {
    it('automatically wraps it in an object', function (done) {
      let string = '' + Math.random();
      requestCallback = function (payload) {
        expect(payload).to.contain.keys('text')
        expect(payload.text).to.equal(string);
        done();
      }
      stream.write(string);
    });

    it('takes into account the default options specified at creation', function (done) {
      let random = Math.random() * 100 | 0;
      let stream = MattermostStream(localURL, { defaults: { foo: random } });
      requestCallback = function (payload) {
        expect(payload).to.contain.keys('foo');
        expect(payload.foo).to.equal(random);
        done();
      }
      stream.write('');
    })
  });

  describe('when called with an object', function () {
    it('sends the object as the payload', function (done) {
      let random = Math.random() * 100 | 0;
      let object = { text: 'Hello World', foo: random };
      requestCallback = function (payload) {
        expect(payload).to.deep.equal(object);
        done();
      }
      stream.write(object);
    });

    it('merges the object onto the defaults supplied at startup', function (done) {
      let stream = MattermostStream(localURL, { defaults: { foo: 'bar', baz: 'bar' }});
      requestCallback = function (payload) {
        expect(payload).to.deep.equal({ foo: 'bar', baz: 'quux', text: 'hello' });
        done();
      }
      stream.write({ baz: 'quux', text: 'hello' });
    });
  })
});
