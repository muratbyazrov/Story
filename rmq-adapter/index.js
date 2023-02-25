const amqp = require('amqplib/callback_api');
const {logger} = require("../logger");
const {RmqError} = require("../errors/rmq-error");

class RmqAdapter {
    constructor(config) {
        this.config = config;
        this.connection = null;
        this.channel = null;
    }

    run(callback) {
        const {host = 'localhost', port = 5672, user, password} = this.config.connect;
        const opt = {credentials: amqp.credentials.plain(user, password)};
        amqp.connect(`amqp://${host}:${port}`, opt, (error, connection) => {
            if (error) {
                logger.error(error);
                throw new RmqError(error);
            }
            logger.info(`Connected to rmq (${host}:${port})`);
            this.connection = connection;
            this.consume(callback);
        });
    }

    consume(callback) {
        const {
            exchange = 'story',
            exchangeType = 'direct',
            exchangeDurable = false,
            queue = 'story',
            queueDurable = false,
            noAck = true,
            prefetchCount = 1,
            xMessageTtl = 10 * 60 * 1000,
        } = this.config.consume;

        this.connection.createChannel((error, channel) => {
            if (error) {
                logger.error(error.message);
                throw new RmqError(error);
            }
            this.channel = channel;

            channel.assertQueue(queue, {
                durable: queueDurable,
                arguments: {
                    "x-message-ttl": xMessageTtl
                }
            });
            channel.prefetch(prefetchCount);
            channel.assertExchange(exchange, exchangeType, {durable: exchangeDurable});

            try {
                channel.consume(queue, msg => {
                    const message = msg.content.toString();
                    logger.info(`Got rmq message ${message}`);
                    callback(message);
                    channel.ack(msg);
                }, {noAck});
            } catch (err) {
                logger.error(err.message);
            }

        });
    }

    async publish(msg, options) {
        if (!options || !options.exchange) {
            throw new RmqError('options or options.exchange not specified');
        }

        const {queue, exchange} = options;
        const {persistent = true} = this.config.consume;
        try {
            logger.info(`Send rmq message: ${msg}`);
            this.channel.publish(exchange, (queue || exchange), Buffer.from(msg), {persistent});
        } catch (err) {
            logger.error(err.message);
            throw new RmqError(err.message);
        }
    }
}

module.exports = {
    RmqAdapter,
};
