/*
Copyright 2019 Expedia Group, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict'

const Os = require('os')
const Hoek = require('@hapi/hoek')
const Lynx = require('lynx')
const StatsDClient = require('statsd-client')

const Schema = require('./schema')
const Timings = require('./timings')

const debug = require('debug')('serviceclient:plugin:statsd')

let statsdApi
function getStatsdApi ({ hostname, port, lynxOptions, transmit, tcp, prefix }) {
  if (statsdApi) {
    return statsdApi
  }

  const statsDClient = tcp ? new StatsDClient({ host: hostname, port: port, tcp }) : new Lynx(hostname, port, lynxOptions)

  const key = [prefix, Os.hostname()].filter(Boolean).join('.')

  function send (client, key, metric, method, transmit, value) {
    if (tcp === true) {
      if (method === 'increment') {
        value = ''
        client.increment(`${key}.${metric}`)
      } else {
        client.timing(`${key}.${metric}`, value)
      }
    } else {
      if (transmit) {
        debug('statsd call client=%s key=%s.%s method=%s %s',
          /* istanbul ignore next */
          client ? client.constructor.name : 'undefined',
          key, metric,
          method,
          typeof value === 'undefined' ? '' : `value=${value}`)
        client[method](`${key}.${metric}`, value)
      }
    }
  }

  statsdApi = {
    increment (metric) { send(statsDClient, key, metric, 'increment', transmit) },
    timing (metric, value) { send(statsDClient, key, metric, 'timing', transmit, value) }
  }

  return statsdApi
}

module.exports = function ({ client }) {
  const opts = client.config('plugins.statsd')

  const { value: config, error } = Schema.validate(opts)
  Hoek.assert(!error, error)

  // if a client opts out, return an empty set of hooks
  if (config === false) {
    return {}
  }

  debug('Plugin enabled for request.')

  const phases = {}

  const statsd = getStatsdApi(config)

  return {
    request ({ ts }) {
      phases.request = ts
    },
    response ({ servicename, operation, response }) {
      statsd.increment(`serviceclient.${servicename}.${operation}.statusCode${response.statusCode}`)
      statsd.increment(`serviceclient.${servicename}.${operation}.statusCode${response.statusCode.toString()[0]}xx`)
    },
    error ({ ts, servicename, operation, error: err }) {
      phases.error = ts

      let code = err.code

      /* istanbul ignore else */
      if (!code) {
        code = err.message && err.message.replace(/ /g, '')
      }

      /* istanbul ignore else */
      if (code) {
        code = code.toLowerCase()
      }

      /* istanbul ignore else */
      if (statsd) {
        statsd.increment(`serviceclient.${servicename}.${operation}.errorCode.${code}`)
      }
    },
    end ({ ts, servicename, operation }) {
      phases.end = ts

      const timings = Timings.calculate(phases)

      /* istanbul ignore else */
      if (typeof timings.total === 'number') {
        statsd.timing(`serviceclient.${servicename}.${operation}.total`, timings.total)
      }
    }
  }
}

/* istanbul ignore next */
module.exports.setStatsD = function (statsd) {
  statsdApi = statsd
}
