const amqp = require('amqplib/callback_api');
const {logger} = require('../logger');
const {RmqError} = require('../errors/rmq-error');

class RmqAdapter {
    constructor(config) {
        this.config = config;
        this.connection = null;
        this.channel = null;
        this.signature = null;
    }

    run(callback) {
        const {connect: {host = 'localhost', port, user, password} = {}} = this.config;
        const opt = {credentials: amqp.credentials.plain(user, password)};
        const url = `amqp://${user}:${password}@${host}:${port}`;
        logger.info(`Trying to connect to RMQ at ${url}`);
        amqp.connect(url, opt, (error, connection) => {
            if (error) {
                logger.error(`Failed to connect: ${error.message}`);
                return;
            }
            logger.info(`Connected to RMQ (${host}:${port})`);
            this.connection = connection;
            this.consume(callback);
        });
    }

    consume(callback) {
        const {
            consume: {
                exchange,
                exchangeType,
                exchangeDurable,
                bindPattern,
                queue,
                queueDurable,
                noAck,
                prefetchCount,
                xMessageTtl,
                selfAck,
            },
        } = this.config;

        selfAck && (this.signature = exchange + queue);
        this.connection.createChannel((error, channel) => {
            if (error) {
                logger.error(`Failed to create channel: ${error.message}`);
                return;
            }
            this.channel = channel;
            channel.assertExchange(exchange, exchangeType, {durable: exchangeDurable});
            channel.assertQueue(queue, {
                durable: queueDurable,
                arguments: {
                    'x-message-ttl': xMessageTtl,
                },
            }, (error, q) => {
                if (error) {
                    logger.error(`Failed to assert queue: ${error.message}`);
                    return;
                }
                channel.bindQueue(q.queue, exchange, bindPattern);
                try {
                    logger.info(`Starting to consume messages from queue ${q.queue}`);
                    channel.consume(q.queue, msg => {
                        if (!msg) {
                            return;
                        }

                        let payload;
                        try {
                            payload = JSON.parse(msg.content.toString());
                        } catch (err) {
                            logger.error(`Invalid RMQ payload: ${err.message}`);
                            if (!noAck) {
                                channel.ack(msg);
                            }
                            return;
                        }

                        const {message, signature} = payload;
                        if (signature === this.signature && selfAck) {
                            if (!noAck) {
                                channel.ack(msg);
                            }
                            return;
                        }

                        Promise.resolve(callback(message))
                            .then(() => {
                                if (!noAck) {
                                    channel.ack(msg);
                                }
                            })
                            .catch(err => {
                                logger.error(`Error during message callback: ${err.message}`);
                                if (!noAck) {
                                    channel.nack(msg, false, true);
                                }
                            });
                    }, {noAck});
                } catch (err) {
                    logger.error(`Error during message consumption: ${err.message}`);
                }
            });
            channel.prefetch(prefetchCount);
        });
    }

    publish({message, options}) {
        if (!options || !options.exchange) {
            throw new RmqError('options or options.exchange not specified');
        }
        const {exchange, routingKey = ''} = options;
        const {publish: {persistent = false} = {}} = this.config;
        const msg = JSON.stringify({message, signature: this.signature});
        try {
            logger.info(`Publishing message to exchange ${exchange} with routing key ${routingKey}`);
            this.channel.publish(exchange, routingKey, Buffer.from(msg), {persistent});
            logger.info(`Message published: ${message}`);
        } catch (err) {
            logger.error(`Failed to publish message: ${err.message}`);
            throw new RmqError(err.message);
        }
    }
}

module.exports = {
    RmqAdapter,
};
