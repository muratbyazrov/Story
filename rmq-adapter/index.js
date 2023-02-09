const amqp = require('amqplib/callback_api');
const {logger} = require("../logger");
const {RmqError} = require("../errors/rmq-error");

class RmqAdapter {
    constructor(config) {
        this.config = config;
        this.connection = null;
    }

    run(callback) {
        const {host = 'localhost', port = 5672, queueName = 'story', user, password} = this.config;
        const opt = {credentials: amqp.credentials.plain(user, password)};
        // connect to rabbit
        amqp.connect(`amqp://${host}:${port}`, opt, (error, connection) => {
            if (error) {
                logger.error(error);
                throw new RmqError(error);
            }
            logger.info(`Connected to rmq host ${host}:${port}`);
            // listen
            connection.createChannel((error, channel) => {
                if (error) {
                    logger.error(error.message);
                    throw new RmqError(error);
                }
                channel.assertQueue(queueName);
                channel.consume(queueName, msg => {
                    const message = msg.content.toString();
                    logger.info(`Got rmq message ${message}`);
                    callback(message);
                    channel.ack(msg);
                });
                // for sender
                this.channel = channel;
                this.queue = queueName;
            });
        });
    }

    send(msg) {
        try {
            logger.info(`Send rmq message: ${msg}`);
            this.channel.sendToQueue(this.queue, Buffer.from(msg));
        } catch (err) {
            logger.error(err.message);
        }
    }
}

module.exports = {
    RmqAdapter,
};
