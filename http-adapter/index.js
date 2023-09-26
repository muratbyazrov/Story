const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {logger} = require('../logger');
const {fileProcessor} = require('../file-processor');

/**
 * HTTP Adapter for handling incoming HTTP requests and invoking a callback function.
 * @class
 */
class HttpAdapter {
    /**
     * Creates an instance of HttpAdapter.
     * @param {object} httpConfig - Configuration object.
     * @param {string} httpConfig.host - The host on which the HTTP server should listen.
     * @param {number} httpConfig.port - The port on which the HTTP server should listen.
     * @param {string} httpConfig.path - The path on which the HTTP server should listen.
     * @param {object} [fileProcessorConfig] - Configuration for a file processor (if applicable).
     * @param {object} [fileProcessorConfig.protocols] - Configuration for various protocols.
     * @param {boolean} [fileProcessorConfig.protocols.http] - Configuration for HTTP protocol.
     */
    constructor(httpConfig, fileProcessorConfig) {
        this.httpConfig = httpConfig;
        this.fileProcessorConfig = fileProcessorConfig;
    }

    /**
     * Start the HTTP server and set up request handling.
     * @param {function} callback - The callback function to be invoked when a POST request is received.
     */
    run(callback) {
        const {host, port} = this.httpConfig;
        app.listen(port, host, () => {
            logger.info(`App listening http (${host}:${port})`);
        });
        app.use(bodyParser.json());
        app.post(this.httpConfig.path, async (req, res) => res.send(await callback(req.body)));
        this.fileProcessorConfig && this.fileProcessorConfig.protocols.http && fileProcessor.httpRun(callback);
    }
}

module.exports = {HttpAdapter};
