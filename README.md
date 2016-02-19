# hermione-tunnel

Plugin for setting up ssh tunnel while running tests with Hermione.

## Installation

`npm i hermione-tunnel`

## Configuration

- __host__ `String` Address of remote host to which tunnel will be established.
- __ports__ `Object` Ports range on remote host, port will be picked randomly from this range. If you want to set specific port, __min__ and __max__ values must be the same.
- __ports.min__ `Number` Min port number.
- __ports.max__ `Number` Max port number.
- __localport__ `Number|Function` Available port on local machine. If set to `Function`, it should return `Promise`. If promise is rejected, plugin will fail.
- __enabled__ (optional) `Boolean` Determines whether plugin is enabled. If set to `false` plugin will do nothing. Defaults to `true`.
- __retries__ (optional) `Number` of attempts to establish tunnel. Defaults to `5`.
- __protocol__ (optional) `String` Protocol which will be used in resulting root url. Defaults to `http`.

Set the configuration to your `.hermione.conf.js`

```javascript
plugins: {
    'hermione-tunnel': {
        host: remote_host_address,
        ports: {
            min: 8201,
            max: 8400
        },
        localport: 3333,
        retries: 3,
        protocol: 'https'
    }
}
```
