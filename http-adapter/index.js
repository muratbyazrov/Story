const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {logger} = require('../logger');
const multer = require('multer');
const path = require('path');

class HttpAdapter {
    constructor(options) {
        this.config = options;
    }

    run(callback) {
        app.listen(this.config.port, this.config.host, () => {
            logger.info(`App listening http (${this.config.host}:${this.config.port})`);
        });
        app.use(bodyParser.json());
        app.post(this.config.path, async (req, res) => res.send(await callback(req.body)));

        const {uploadsPath = `${this.config.path}/uploads`, downloadsPath = `${this.config.path}/downloads`} = this.config;
        const upload = multer({dest: 'uploads/'}).any();
        app.use(uploadsPath, async (req, res, next) => {
            const result = await callback({...req.headers, params: {}});
            result.error && res.send(result);
            next();
        });
        app.post(uploadsPath, upload, async (req, res) => {
            const {domain, event, token} = req.headers;
            res.send(await callback({domain, event, token, params: {files: req.files}}));
        });
        app.use(downloadsPath, express.static(`${path.dirname(require.main.filename)}/uploads`));
    }
}

module.exports = {
    HttpAdapter,
};
