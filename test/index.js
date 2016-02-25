'use strict';

var q = require('q'),
    QEmitter = require('qemitter'),
    _ = require('lodash'),
    Tunnel = require('ssh-tun'),
    plugin = require('../lib/plugin');

var MIN_CONFIG = {
        host: 'example.com',
        ports: {
            min: 8000,
            max: 8000
        },
        localport: 3333
    };

function MkHermione() {
    var emitter = new QEmitter();

    emitter.config = {
        baseUrl: 'http://localhost:3333/search'
    };

    emitter.events = {
        RUNNER_START: 'startRunner',
        RUNNER_END: 'endRunner'
    };

    return emitter;
}

describe('plugin', function() {
    var sandbox = sinon.sandbox.create(),
        hermione;

    beforeEach(function() {
        hermione = new MkHermione();
        sandbox.spy(hermione, 'on');
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('starting', function() {
        it('should not start if "config" is not an object', function() {
            plugin(hermione, null);

            assert.notCalled(hermione.on);
        });

        it('should not start if "enabled" is set to false', function() {
            plugin(hermione, _.defaults({enabled: false}, MIN_CONFIG));

            assert.notCalled(hermione.on);
        });

        it('should start if "enabled" is not set', function() {
            plugin(hermione, MIN_CONFIG);

            assert.called(hermione.on);
        });

        it('should start if "enabled" is set to true', function() {
            plugin(hermione, _.defaults({enabled: true}, MIN_CONFIG));

            assert.called(hermione.on);
        });

        it('should throw if "host" is not set', function() {
            assert.throws(function() {
                return plugin(hermione, _.defaults({host: null}, MIN_CONFIG));
            }, 'Missing required option: host');
        });

        it('should throw if "ports" is not set', function() {
            assert.throws(function() {
                return plugin(hermione, _.defaults({ports: null}, MIN_CONFIG));
            }, 'Missing required option: ports');
        });

        it('should throw if "localport" is not set', function() {
            assert.throws(function() {
                return plugin(hermione, _.defaults({localport: null}, MIN_CONFIG));
            }, 'Missing required option: localport');
        });
    });

    describe('tunnel', function() {
        beforeEach(function() {
            sandbox.stub(Tunnel, 'openWithRetries');
            Tunnel.openWithRetries.returns(q.resolve(new Tunnel(MIN_CONFIG)));
        });

        it('should try to open with options specified in config', function() {
            var config = _.defaults({retries: 1}, MIN_CONFIG);

            plugin(hermione, config);

            return hermione.emitAndWait(hermione.events.RUNNER_START).then(function() {
                assert.calledWith(Tunnel.openWithRetries, config);
            });
        });

        it('should try to close tunnel on endRunner', function() {
            sandbox.spy(Tunnel.prototype, 'close');

            plugin(hermione, MIN_CONFIG);

            return hermione.emitAndWait(hermione.events.RUNNER_START).then(function() {
                return hermione.emitAndWait(hermione.events.RUNNER_END).then(function() {
                    assert.called(Tunnel.prototype.close);
                });
            });
        });
    });

    describe('options', function() {
        beforeEach(function() {
            sandbox.stub(Tunnel, 'openWithRetries');
            Tunnel.openWithRetries.returns(q.resolve(new Tunnel(MIN_CONFIG)));
        });

        it('should use default protocol if "protocol" is not set in config', function() {
            plugin(hermione, MIN_CONFIG);

            return hermione.emitAndWait(hermione.events.RUNNER_START).then(function() {
                assert.include(hermione.config.baseUrl, 'http://');
            });
        });

        it('should use protocol provided in config', function() {
            plugin(hermione, _.defaults({protocol: 'https'}, MIN_CONFIG));

            return hermione.emitAndWait(hermione.events.RUNNER_START).then(function() {
                assert.include(hermione.config.baseUrl, 'https://');
            });
        });

        it('baseUrl should be properly changed to include remote host/port and local path', function() {
            plugin(hermione, MIN_CONFIG);

            return hermione.emitAndWait(hermione.events.RUNNER_START).then(function() {
                assert.strictEqual(hermione.config.baseUrl, 'http://example.com:8000/search');
            });
        });

        describe('"localport" is a function', function() {
            var config;

            beforeEach(function() {
                config = _.defaults({localport: sinon.stub()}, MIN_CONFIG);
            });

            it('should detect localport if promise is resolved', function() {
                config.localport.returns(q.resolve(4444));

                plugin(hermione, config);

                return hermione.emitAndWait(hermione.events.RUNNER_START).then(function() {
                    assert.calledWithMatch(Tunnel.openWithRetries, {localport: 4444});
                });
            });

            it('should throw if "localport" promise is rejected', function() {
                config.localport.returns(q.reject(new Error('Could not find free port')));

                plugin(hermione, config);

                return assert.isRejected(hermione.emitAndWait(hermione.events.RUNNER_START), 'Could not find free port');
            });
        });
    });
});
