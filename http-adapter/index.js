const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {logger} = require('../logger');
const {filesAdapter} = require('../files-adapter');

/** @class */
class HttpAdapter {
    /**
     * Creates an instance of HttpAdapter.
     * @param {object} httpConfig - Configuration object.
     * @param {string} httpConfig.host - The host on which the HTTP server should listen.
     * @param {number} httpConfig.port - The port on which the HTTP server should listen.
     * @param {string} httpConfig.path - The path on which the HTTP server should listen.
     * @param {object} [filesAdapterConfig] - Configuration for a file adapter.
     * @param {object} [filesAdapterConfig.protocols] - Configuration for various protocols.
     * @param {boolean} [filesAdapterConfig.protocols.http] - Configuration for HTTP protocol.
     */
    constructor(httpConfig, filesAdapterConfig) {
        this.httpConfig = httpConfig;
        this.filesAdapterConfig = filesAdapterConfig;
    }

    /**
     * Start the HTTP server and set up request handling.
     * @param {function} callback - The callback function to be invoked when a POST request is received.
     */
    run(callback) {
        const {host, port} = this.httpConfig;
        app.listen(port, host, () => {
            logger.info(`App listening HTTP (${host}:${port})`);
        });
        app.use(bodyParser.json());
        app.post(this.httpConfig.path, async (req, res) => res.send(await callback(req.body)));

        this.filesAdapterConfig && this.filesAdapterConfig.protocols.http &&
        filesAdapter.httpRun(app, callback);
    }
}

module.exports = {HttpAdapter};
