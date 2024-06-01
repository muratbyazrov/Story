const express = require('express');
const {logger} = require("../logger");
const multer = require('multer');
const path = require('path');
const mime = require('mime-types');
const sharp = require('sharp');
const fs = require('fs');
const {BadRequestError, InternalError} = require('../errors')

/** Class for processing files via HTTP, WebSocket, and RabbitMQ */
class FilesAdapter {
    /**
     * @param {object} [config] - Configuration for a files adapter
     * @param {number} [config.maxFileSizeMb] - Configuration for a files size
     * @param {string} [config.createPath] - Configuration for a files adapter uploads path
     * @param {string} [config.getPath] - Configuration for a files adapter downloads path
     * @param {object} [config.protocols] - Protocols configuration
     * @param {boolean} [config.protocols.http] - Configuration filed adapter for HTTP protocol
     * @param {boolean} [config.protocols.ws] - Configuration filed adapter for WS protocol
     * @param {boolean} [config.protocols.rmq] - Configuration filed adapter for RMQ protocol
     * @param {object} [config.imagesCompression] - Configuration for a files adapter compression
     * @param {number} [config.imagesCompression.widthPx] - New image width in px
     * @param {number} [config.imagesCompression.heightPx] - New image height in px
     */
    init(config) {
        this.config = config;
        logger.info(`Files adapter listen ${config.getPath}`);
    }

    /**
     * Start the HTTP server to process file uploads
     * @param {function} app - Express app instance
     * @param {function} app.post - Express app instance post method
     * @param {function} app.use - Express app instance use method
     * @param {Function} callback - It's a gate runner
     */
    httpRun(app, callback) {
        const {
            createPath,
            getPath,
            destination,
            maxFileSizeMb,
            imagesCompression: {
                widthPx = null,
                heightPx = null,
            }
        } = this.config;

        const storage = multer.memoryStorage();
        const upload = multer({storage: storage});

        app.post(createPath, upload.single('image'), async (req, res) => {
            try {
                if (!req.file) {
                    throw new BadRequestError('File is not specify');
                }

                const fileSizeInMB = req.file.size / (1024 * 1024);
                if (fileSizeInMB >= maxFileSizeMb) {
                    throw new BadRequestError('File is too large');
                }

                if (!fs.existsSync(destination)) {
                    fs.mkdirSync(destination, {recursive: true});
                }

                const filename = `${Date.now()}.${mime.extension(req.file.mimetype)}`;
                await sharp(req.file.buffer)
                    .resize(widthPx, heightPx)
                    .toFile(path.join(destination, filename), (err, info) => {
                        if (err) {
                            throw new InternalError(err);
                        } else {
                            logger.info(`The image has been successfully uploaded: ${JSON.stringify(info)}`);
                        }
                    });

                const {domain, event, token} = req.headers;
                const {params = {}} = req.body;
                const result = await callback({
                    domain, event,
                    params: {data: JSON.parse(params), files: {...req.file, filename}},
                    token,
                });
                res.send(result);
            } catch (error) {
                const {domain, event, token} = req.headers;
                const result = await callback({
                    domain, event, token,
                    params: {},
                    error
                });
                res.send(result);
            }
        });

        app.use(getPath, express.static(destination)); // or `${path.dirname(require.main.filename)}/uploads`
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

    /**
     * Delete a file by name from the specified directory.
     * @param {string} filename - The name of the file to delete.
     * @returns {Promise<void>} - A Promise that resolves when the file is deleted.
     */
    async deleteFileByName(filename) {
        if (!filename) {
            throw new BadRequestError('Param "filename" must be specified');
        }

        const {destination} = this.config;
        const filePath = path.join(destination, filename);

        try {
            await fs.promises.unlink(filePath);
            logger.info(`File '${filename}' has been deleted.`);
        } catch (error) {
            logger.error(`Error deleting file '${filename}': ${error.message}`);
            throw new InternalError(`Error deleting file '${filename}': ${error.message}`);
        }
    }
}

module.exports = {filesAdapter: new FilesAdapter()};
