const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {logger} = require('../logger');
const multer = require('multer');
const path = require('path');
const mime = require('mime-types');

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
        processFiles && this.processFiles(callback);
    }

    processFiles(callback) {
        const {uploadsPath = `${this.config.path}/uploads`, downloadsPath = `${this.config.path}/downloads`} = this.config;
        const storage = multer.diskStorage({
            destination: 'uploads/',
            filename: function (req, file, cb) {
                cb(null, `${file.fieldname}-${Date.now()}.${mime.extension(file.mimetype)}`);
            }
        });
        const upload = multer({ storage }).any();

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
