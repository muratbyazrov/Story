const {logger} = require('../logger');
const path = require('path');
const mime = require('mime-types');
const sharp = require('sharp');
const fs = require('fs');
const {BadRequestError, InternalError} = require('../errors');
const {gate} = require('../gate');

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
            },
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

        const extension = mime.extension(req.file.mimetype);
        if (!extension) {
            throw new BadRequestError('Unable to determine file extension');
        }

        const filename = `${Date.now()}.${extension}`;
        try {
            const info = await sharp(req.file.buffer)
                .resize(widthPx, heightPx)
                .toFile(path.join(destination, filename));
            logger.info(`The image has been successfully uploaded: ${JSON.stringify(info)}`);
        } catch (error) {
            throw new InternalError(error.message || error);
        }

        const {domain, event, token} = req.headers;
        const {params = {}} = req.body;
        let parsedParams = params;
        if (typeof params === 'string') {
            try {
                parsedParams = JSON.parse(params);
            } catch (error) {
                throw new BadRequestError('"params" must be valid JSON');
            }
        }
        return callback({
            domain, event,
            params: {data: parsedParams, files: {...req.file, filename}},
            token,
        });
    }

    async base64Processing(req, res, callback) {
        await gate.validate(req.body);

        const {
            destination,
            maxFileSizeMb,
            imagesCompression: {
                enabled: imagesCompressionEnabled,
                widthPx,
                heightPx,
            },
        } = this.config;

        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, {recursive: true});
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

        if (result.error) {
            return result;
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(destination, filename);

        // file maxsize checking
        const fileSizeMb = buffer.length / (1024 * 1024);
        if (fileSizeMb > maxFileSizeMb) {
            throw new BadRequestError(`File size exceeds the maximum limit of ${maxFileSizeMb} MB`);
        }

        // compression
        try {
            if (imagesCompressionEnabled) {
                await sharp(buffer)
                    .resize(widthPx, heightPx)
                    .toFile(filePath);
            } else {
                await fs.promises.writeFile(filePath, buffer);
            }
        } catch (error) {
            throw new InternalError('Failed to save file');
        }

        logger.info(`The image has been successfully uploaded and compressed: ${filePath}`);

        return result;
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
