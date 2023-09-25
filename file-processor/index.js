const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const mime = require('mime-types');

class FileProcessor {
    constructor(options) {
        this.config = options;
    }

    run({protocol, callback}) {
        protocol === 'http' && this.httpFileProcessor(callback);
    }

    httpFileProcessor(callback) {
        const {
            uploadsPath = `${this.config.path}/uploads`,
            downloadsPath = `${this.config.path}/downloads`
        } = this.config;
        const storage = multer.diskStorage({
            destination: 'uploads/',
            filename: function (req, file, cb) {
                cb(null, `${file.fieldname}-${Date.now()}.${mime.extension(file.mimetype)}`);
            }
        });
        const upload = multer({storage}).any();
        app.post(uploadsPath, upload, async (req, res) => {
            const {domain, event, token} = req.headers;
            const result = await callback({domain, event, params: {files: req.files}, token});
            // Если ошибка - удалить файл: result.error &&...
            res.send(result);
        });
        app.use(downloadsPath, express.static(`${path.dirname(require.main.filename)}/uploads`));
    }
}

module.exports = {
    fileProcessor: new FileProcessor(),
};
