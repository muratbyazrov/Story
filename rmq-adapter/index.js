const amqp = require('amqplib/callback_api');
const {logger} = require("../logger");
const {RmqError} = require("../errors/rmq-error");

class RmqAdapter {
    constructor(config) {
        this.config = config;
        this.connection = null;
    }

    run(callback) {
        const {host = 'localhost', port = 5672, user, password} = this.config;
        const opt = {credentials: amqp.credentials.plain(user, password)};
        amqp.connect(`amqp://${host}:${port}`, opt, (error, connection) => {
            if (error) {
                logger.error(error);
                throw new RmqError(error);
            }
            logger.info(`Connected to rmq (${host}:${port})`);
            this.connection = connection;
        });
        this.consume(callback);
    }

    consume(callback) {
        const {queue, durable} = this.config.consuming;
        this.connection.createChannel((error, channel) => {
            if (error) {
                logger.error(error.message);
                throw new RmqError(error);
            }
            channel.assertQueue(queue, {durable});

            const message = msg.content.toString();
            logger.info(`Got rmq message ${message}`);
            try {
                channel.consume(consQueue, msg => {
                    callback(message);
                    channel.ack(msg);
                });
            } catch (err) {
                logger.error(err.message);
                channel.noAck(msg);
            }

        });
    }

    publish(msg, options) {
        const {queue} = options;
        this.connection.createChannel((error, channel) => {
            if (error) {
                logger.error(error.message);
                throw new RmqError(error);
            }
            channel.assertQueue(queue);
            try {
                logger.info(`Send rmq message: ${msg}`);
                this.channel.sendToQueue(queue, Buffer.from(msg));
            } catch (err) {
                logger.error(err.message);
            }
        });
    }
}

module.exports = {
    RmqAdapter,
};
