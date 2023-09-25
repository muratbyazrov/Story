const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {logger} = require('../logger');
const {fileProcessor} = require('../file-processor');

class HttpAdapter {
    constructor(options) {
        this.config = options;
    }

    run(callback) {
        const {host, port, processFiles = false} = this.config;
        app.listen(port, host, () => {
            logger.info(`App listening http (${host}:${port})`);
        });
        app.use(bodyParser.json());
        app.post(this.config.path, async (req, res) => res.send(await callback(req.body)));
        processFiles && fileProcessor.run({protocol: 'http', callback});
    }
}

module.exports = {
    HttpAdapter,
};
