# hermione-tunnel

Plugin for setting up ssh tunnel while running tests with Hermione.

## Installation

`npm i hermione-tunnel`

## Configuration

- __host__ (mandatory) `String` Address of remote host to which tunnel will be established.
- __ports__ (mandatory) `Object` Ports range on remote host, port will be picked randomly from this range. If you want to set specific port, __min__ and __max__ values must be the same.
- __ports.min__ (mandatory) `Number` Min port number.
- __ports.max__ (mandatory) `Number` Max port number.
- __localport__ (mandatory) `Number|Function` Available port on local machine. If set to `Function`, it should return `Promise` which will be resolved with the actual port number. If promise is rejected, plugin will fail.
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

## FAQ
### Tunnel to example.com closed. Exit code: 255
Usually it's a problem with permissions to the host (`example.com` in this example). You can manually create an ssh tunnel. Let's assume that you want to open a tunnel from `localhost:8080` to `example.com:9000`.

Run the following command.
```
$ ssh -v example.com -R 9000:localhost:8080 -N
```

And open an url `http://example.com:9000/` in a browser.

### Error: timeout of 60000ms exceeded. Ensure the done() callback is being called in this test.
First of all, make sure that `done()` is executed in the test. If so, then this error means that Selenium grid doesn't have permissions to the tunneled host. Please ask your administrator to fix this issue.
