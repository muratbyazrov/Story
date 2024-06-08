const amqp = require('amqplib/callback_api');
const {logger} = require("../logger");
const {RmqError} = require("../errors/rmq-error");

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
        amqp.connect(`amqp://${host}:${port}`, opt, (error, connection) => {
            if (error) {
                logger.error(error);
                throw new RmqError(error);
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
                logger.error(error.message);
                throw new RmqError(error);
            }
            this.channel = channel;
            channel.assertExchange(exchange, exchangeType, {durable: exchangeDurable});
            channel.assertQueue(queue, {
                    durable: queueDurable,
                    arguments: {
                        "x-message-ttl": xMessageTtl
                    }
                },
                (error, q) => {
                    if (error) {
                        throw new RmqError(error.message);
                    }
                    channel.bindQueue(q.queue, exchange, bindPattern);
                    try {
                        channel.consume(q.queue, msg => {
                            const {message, signature} = JSON.parse(msg.content.toString());
                            if (signature === this.signature && selfAck) {
                                return channel.ack(msg);
                            }
                            callback(message);
                            channel.ack(msg);
                        }, {noAck});
                    } catch (err) {
                        logger.error(err.message);
                    }
                },
            );
            channel.prefetch(prefetchCount);
        });
    }

    async publish({message, options}) {
        if (!options || !options.exchange) {
            throw new RmqError('options or options.exchange not specified');
        }
        const {exchange, routingKey = ''} = options;
        const {publish: {persistent = false} = {}} = this.config;
        const msg = JSON.stringify({message, signature: this.signature});
        try {
            logger.info({'Send rmq request': message});
            this.channel.publish(exchange, routingKey, Buffer.from(msg), {persistent});
        } catch (err) {
            logger.error(err.message);
            throw new RmqError(err.message);
        }
    }
}

module.exports = {
    RmqAdapter,
};
