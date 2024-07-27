const {logger} = require("../logger");
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
     * @param {Object} req - Request
     * @param {Object} res - Express app instance use method
     * @param {Function} callback - It's a gate runner
     */
    async multipartProcessing(req, res, callback) {
        const {
            destination,
            maxFileSizeMb,
            imagesCompression: {
                widthPx = null,
                heightPx = null,
            }
        } = this.config;

        if (!req.file) {
            throw new BadRequestError('File is not specify');
        }

        const fileSizeInMB = req.file.size / (1024 * 1024);
        if (fileSizeInMB >= maxFileSizeMb) {
            throw new BadRequestError(`File size exceeds the maximum limit of ${maxFileSizeMb} MB`);
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
        return await callback({
            domain, event,
            params: {data: JSON.parse(params), files: {...req.file, filename}},
            token,
        });
    }

    async base64Processing(req, res, callback) {
        const {
            destination,
            maxFileSizeMb,
            imagesCompression: {
                enabled: imagesCompressionEnabled,
                widthPx,
                heightPx,
            }
        } = this.config;

        if (!req.body.params) {
            throw new BadRequestError('"params" must be specified in request body');
        }

        const {base64File} = req.body.params;
        if (!base64File) {
            throw new BadRequestError('"base64File" must be specified in request params');
        }

        const matches = base64File.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches) {
            throw new BadRequestError('Invalid base64 format');
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const extension = mime.extension(mimeType);
        if (!extension) {
            throw new BadRequestError('Unable to determine file extension');
        }

        const filename = `${Date.now()}.${extension}`;
        const result = await callback({...req.body, params: {...req.body.params, filename}});

        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(destination, filename);

        // file maxsize checking
        const fileSizeMb = buffer.length / (1024 * 1024);
        if (fileSizeMb > maxFileSizeMb) {
            throw new BadRequestError(`File size exceeds the maximum limit of ${maxFileSizeMb} MB`);
        }

        // compression
        if (imagesCompressionEnabled) {
            await sharp(buffer)
                .resize(widthPx, heightPx)
                .toFile(filePath);
        }

        fs.writeFile(filePath, buffer, (err) => {
            if (err) {
                throw new InternalError('Failed to save file');
            }

            logger.info(`The image has been successfully uploaded and compressed: ${filePath}`);
            return result;
        });
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
