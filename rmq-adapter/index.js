const amqp = require("amqplib");
const {logger} = require("../logger");
const {RmqError} = require("../errors/rmq-error");

class RmqAdapter {
    constructor(config) {
        this.channel = null;
        this.queue = null;
        this.init(config);
    }

    init({host = 'localhost', port = 5672, queueName = 'story', user, password}) {
        const opt = {credentials: amqp.credentials.plain(user, password)}
        amqp.connect(`amqp://${host}:${port}`, opt, function (error, connection) {
            if (error) {
                logger.error(error);
                throw new RmqError(error);
            }
            logger.info(`Connected to rmq with host ${host}`);

            connection.createChannel(function (error, channel) {
                if (error) {
                    logger.error(error);
                    throw new RmqError(error);
                }
                logger.info(`Created the chanel ${channel}`);

                channel.assertQueue(queueName, {
                    durable: false
                });
                logger.info(`Created the queue ${queueName}`);
                this.channel = channel;
                this.queue = queueName;
            });
        });
    }

    send(msg) {
        try {
            logger.info(`Send by rmq the message: ${msg}`);
            this.channel.sendToQueue(this.queue, Buffer.from(msg));
        } catch (err) {
            logger.error(err.message);
        }
    }

    listen(callback) {
        logger.info(`Listen to rmq messages from ${this.queue}`)
        try {
            this.channel.consume(this.queue, (msg) => {
                const message = msg.content.toString();
                logger.info(`Got rmq message ${message}`);
                callback(message);
            }, {noAck: true});
        } catch (err) {
            logger.error(err.message);
        }
    }
}

module.exports = {
    RmqAdapter,
};
