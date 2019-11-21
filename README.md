# @vrbo/service-client-statsd
[![NPM Version](https://img.shields.io/npm/v/@vrbo/service-client-statsd.svg?style=flat-square)](https://www.npmjs.com/package/@vrbo/service-client-statsd)
[![Build Status](https://travis-ci.org/expediagroup/service-client-statsd.svg?branch=master)](https://travis-ci.org/expediagroup/service-client-statsd)
[![Dependency Status](https://david-dm.org/expediagroup/service-client-statsd.svg?theme=shields.io)](https://david-dm.org/expediagroup/service-client-statsd)
[![NPM Downloads](https://img.shields.io/npm/dm/@vrbo/service-client-statsd.svg?style=flat-square)](https://npm-stat.com/charts.html?package=@vrbo/service-client-statsd)

A [Service Client](https://github.com/expediagroup/service-client) plugin for reporting operational metrics to a [StatsD](https://github.com/statsd/statsd) daemon.

## Contents
* [Usage](#usage)
* [Configuration Options](#configuration-options)
* [Development](#development)
* [Further Reading](#further-reading)

## Usage
```javascript
const ServiceClient = require('@vrbo/service-client');
const SCStatsD = require('@vrbo/service-client-statsd');

ServiceClient.use(SCStatsD);

const client = ServiceClient.create('myservice')

(async function() {
    await client.request({ method: 'GET', path: '/v1/test/endpoint', operation: 'foobar' })
    /**
     * Outputs metrics to StatsD daemon:
     * localhost.serviceclient.myservice.foobar.statusCode200 method=increment
     * localhost.serviceclient.myservice.foobar.statusCode2xx method=increment
     * localhost.serviceclient.myservice.foobar.total method=timing value=1
     */
})()
```

See [plugin documentation](https://github.com/expediagroup/service-client#plugins) for more usage information.

## Configuration Options
- **hostname** - The hostname used to initialize the internal instance of [Lynx](https://github.com/dscape/lynx). Defaults to `'localhost'`.
- **port** - The port used to initilize the internal instance of [Lynx](https://github.com/dscape/lynx). Defaults to `8125`.
- **lynxOptions** - Additional configuration options used to initilize the internal instance of [Lynx](https://github.com/dscape/lynx).
- **transmit** - A boolean indicating whether or not to actually send these metrics to the [Lynx](https://github.com/dscape/lynx) instance. Defaults to `true`.
- **prefix** - An optional value to prepend to the beginning of the metrics key reported to StatsD.

Example:
```javascript
const client = ServiceClient.create('myservice', {
    plugins: {
        statsd: {
            // options here
        }
    }
})
```

## Development
This package uses [`debug`](https://github.com/visionmedia/debug) for logging debug statements.

Use the `serviceclient:plugin:statsd` namespace to log related information:
```bash
DEBUG=serviceclient:plugin:statsd npm test
```

## Further Reading
* [License](LICENSE)
* [Code of conduct](CODE_OF_CONDUCT.md)
* [Contributing](CONTRIBUTING.md)
* [Changelog](CHANGELOG.md)
