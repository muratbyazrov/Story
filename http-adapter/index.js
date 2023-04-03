const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {logger} = require('../logger');
const multer = require('multer');

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

        const uploadPath = this.config.uploadsPath || `${this.config.path}/uploads`;
        const upload = multer({dest: 'uploads/'}).any();
        app.use(uploadPath, async (req, res, next) => {
            const result = await callback({...req.headers, params: {}});
            result.error && res.send(result);
            next();
        });
        app.post(uploadPath, upload, async (req, res) => {
            const {domain, event, token} = req.headers;
            res.send(await callback({domain, event, token, params: {files: req.files}}));
        });
    }
}

module.exports = {
    HttpAdapter,
};
