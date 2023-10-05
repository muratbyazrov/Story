const express = require('express');
const {logger} = require("../logger");
const multer = require('multer');
const path = require('path');
const mime = require('mime-types');
const sharp = require('sharp');

/** Class for processing files via HTTP, WebSocket, and RabbitMQ */
class FilesAdapter {
    /**
     * @param {object} [config] - Configuration for a files adapter
     * @param {string} [config.maxFileSize] - Configuration for a files size.
     * @param {boolean} [config.compression] - Configuration for a files adapter compression.
     * @param {string} [config.uploadsPath] - Configuration for a files adapter uploads path.
     * @param {string} [config.downloadsPath] - Configuration for a files adapter downloads path.
     * @param {object} [config.protocols] - Protocols configuration.
     * @param {boolean} [config.protocols.http] - Configuration filed adapter for HTTP protocol.
     * @param {boolean} [config.protocols.ws] - Configuration filed adapter for WS protocol.
     * @param {boolean} [config.protocols.rmq] - Configuration filed adapter for RMQ protocol.
     */
    init(config) {
        this.config = config;
        logger.info(`Files adapter listen ${config.uploadsPath}`);
    }

    /**
     * Start the HTTP server to process file uploads.
     * @param {function} app - Express app instance
     * @param {function} app.post - Express app instance post method
     * @param {function} app.use - Express app instance use method
     * @param {Function} callback - It's a gate runner
     */
    httpRun(app, callback) {
        const {
            uploadsPath = '/uploads',
            downloadsPath = '/downloads',
            maxFilesCount = 1,
            maxFileSize = 1,
        } = this.config;

        const storage = multer.diskStorage({
            destination: 'uploads/',
            filename: function (req, file, cb) {
                cb(null, `${file.fieldname}-${Date.now()}.${mime.extension(file.mimetype)}`);
            },
        });
        const upload = multer({
            storage,
            // limits: {fileSize: 20 * 1024 * 1024} // Ограничение размера файла до 20 МБ
        }).any();

        app.post(uploadsPath, upload, async (req, res) => {
            const {domain, event, token} = req.headers;
            await this._compressImages(req);

            const result = await callback({
                domain, event, token,
                params: {files: req.files},
            });
            res.send(result);
        });

        app.use(downloadsPath, express.static(`${path.dirname(require.main.filename)}/uploads`));
    }

    async _compressImages(req) {
        return await Promise.all(
            req.files.map(async (file) => {
                if (file.size > 100 * 1024) { // Если файл больше 100 кБ, сжимаем
                    const compressedImage = await sharp(file.path)
                        .resize(200, null, {
                            fit: 'contain',
                            position: sharp.strategy.attention,
                        })
                        .toFormat('jpeg')
                        .jpeg({quality: 10})
                        .toBuffer();

                    return {
                        fieldname: file.fieldname,
                        originalname: file.originalname,
                        buffer: compressedImage,
                    };
                } else {
                    return file;
                }
            })
        );
    }

    /**
     * Start WebSocket server for processing files.
     */
    wsRun() {
        // Code for processing files received via WebSocket.
    }

    /**
     * Start RabbitMQ consumer for processing files.
     */
    rmqRun() {
        // Code for processing files received via RabbitMQ.
    }
}

module.exports = {filesAdapter: new FilesAdapter()};
