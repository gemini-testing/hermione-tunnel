'use strict';

var url = require('url'),
    q = require('q'),
    _ = require('lodash'),
    Tunnel = require('ssh-tun');

module.exports = function(hermione, opts) {
    if (!_.isObject(opts)) {
        return;
    }

    _.defaults(opts, {
        protocol: 'http',
        retries: 5,
        enabled: true
    });

    if (!opts.enabled) {
        return;
    }

    ['host', 'ports', 'localport'].forEach(function(name) {
        if (!opts[name]) {
            throw new Error('Missing required option: ' + name);
        }
    });

    var tunnel;

    hermione.on(hermione.events.RUNNER_START, function() {
        return q
            .invoke(function() {
                return _.isFunction(opts.localport) ? opts.localport() : opts.localport;
            })
            .then(function(localport) {
                return Tunnel.openWithRetries(
                    _.extend(opts, {localport: localport}),
                    opts.retries
                );
            })
            .then(function(openedTunnel) {
                tunnel = openedTunnel;

                var origBaseUrl = hermione.config.baseUrl,
                    pathname = url.parse(origBaseUrl).pathname;

                hermione.config.baseUrl = url.format({
                    protocol: opts.protocol,
                    host: tunnel.proxyUrl,
                    pathname: pathname
                });
            });
    });

    hermione.on(hermione.events.RUNNER_END, function() {
        return tunnel && tunnel.close();
    });
};
