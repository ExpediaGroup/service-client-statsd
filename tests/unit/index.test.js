'use strict'

const Boom = require('boom')
const { assert } = require('chai')
const Hapi = require('hapi')
const Hoek = require('hoek')
const Nock = require('nock')
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')

const ServiceClient = require('@vrbo/service-client')

describe('metrics', function () {
  let suite

  before(function () {
    Proxyquire.noCallThru()
  })

  beforeEach(function () {
    suite = {}
    suite.originalConfig = Hoek.clone(__serviceclientconfig) // eslint-disable-line no-undef
    suite.sandbox = Sinon.createSandbox()

    ServiceClient.mergeConfig({
      overrides: {
        'myservice': {
          hostname: 'service.local'
        }
      }
    })

    suite.incrementSpy = suite.sandbox.spy()
    suite.timingSpy = suite.sandbox.spy()

    const ServiceClientStatsD = Proxyquire('../../lib/index', {
      lynx: function () {
        return {
          increment: suite.incrementSpy,
          timing: suite.timingSpy
        }
      }
    })

    ServiceClient.use(ServiceClientStatsD)

    suite.server = Hapi.server()

    suite.server.route([
      {
        method: 'GET',
        path: '/',
        async handler (request) {
          try {
            return await suite.client.request({ context: request, method: 'GET', path: '/v1/test/endpoint', operation: 'foobar' })
          } catch (e) {
            throw Boom.badImplementation(e)
          }
        }
      }
    ])
  })

  afterEach(function () {
    Object.assign(__serviceclientconfig, suite.originalConfig) // eslint-disable-line no-undef
    suite.sandbox.restore()
    suite = null
  })

  describe('configuration', function () {
    beforeEach(async function () {
      Nock('http://service.local:80')
        .get('/v1/test/endpoint')
        .reply(200, { message: 'success' })
    })

    it('should NOT log if disabled', async function () {
      suite.client = ServiceClient.create('myservice', {
        plugins: {
          statsd: false
        }
      })

      await suite.client.request({ method: 'GET', path: '/v1/test/endpoint', operation: 'foobar' })

      Sinon.assert.notCalled(suite.incrementSpy)
      Sinon.assert.notCalled(suite.timingSpy)
    })

    it('should NOT log if `transmit: false`', async function () {
      suite.client = ServiceClient.create('myservice', {
        plugins: {
          statsd: {
            transmit: false
          }
        }
      })

      await suite.client.request({ method: 'GET', path: '/v1/test/endpoint', operation: 'foobar' })

      Sinon.assert.notCalled(suite.incrementSpy)
      Sinon.assert.notCalled(suite.timingSpy)
    })

    it('should reuse cached statsd api object', async function () {
      Nock('http://service.local:80')
        .get('/v1/test/endpoint')
        .reply(200, { message: 'success' })

      suite.client = ServiceClient.create('myservice')

      await suite.client.request({ method: 'GET', path: '/v1/test/endpoint', operation: 'foobar' })
      assert.include(suite.incrementSpy.getCall(0).args[0], 'serviceclient.myservice.foobar.statusCode200')
      assert.include(suite.incrementSpy.getCall(1).args[0], 'serviceclient.myservice.foobar.statusCode2xx')
      assert.include(suite.timingSpy.getCall(0).args[0], 'serviceclient.myservice.foobar.total')

      await suite.client.request({ method: 'GET', path: '/v1/test/endpoint', operation: 'foobar' })
      assert.include(suite.incrementSpy.getCall(2).args[0], 'serviceclient.myservice.foobar.statusCode200')
      assert.include(suite.incrementSpy.getCall(3).args[0], 'serviceclient.myservice.foobar.statusCode2xx')
      assert.include(suite.timingSpy.getCall(1).args[0], 'serviceclient.myservice.foobar.total')
    })
  })

  describe('success', function () {
    beforeEach(async function () {
      Nock('http://service.local:80')
        .get('/v1/test/endpoint')
        .reply(200, { message: 'success' })

      suite.client = ServiceClient.create('myservice')
    })

    it('should log to statsd (no context)', async function () {
      await suite.client.request({ method: 'GET', path: '/v1/test/endpoint', operation: 'foobar' })

      assert.include(suite.incrementSpy.getCall(0).args[0], 'serviceclient.myservice.foobar.statusCode200')
      assert.include(suite.incrementSpy.getCall(1).args[0], 'serviceclient.myservice.foobar.statusCode2xx')
      assert.include(suite.timingSpy.getCall(0).args[0], 'serviceclient.myservice.foobar.total')
    })
  })

  describe('error', function () {
    beforeEach(function () {
      Nock('http://service.local:80')
        .get('/v1/test/endpoint')
        .delayConnection(100)
        .reply(200, { message: 'success' })

      suite.client = ServiceClient.create('myservice', { timeout: 1 })
    })

    it('should log to statsd (no context)', async function () {
      try {
        await suite.client.request({ method: 'GET', path: '/v1/test/endpoint', operation: 'foobar' })
        assert.fail('should fail')
      } catch (err) {
        assert.ok(err, 'is error')
      }

      assert.include(suite.incrementSpy.getCall(0).args[0], 'serviceclient.myservice.foobar.errorCode.clientrequesttimeout')
      assert.include(suite.timingSpy.getCall(0).args[0], 'serviceclient.myservice.foobar.total')
    })
  })
})
