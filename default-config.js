module.exports = {
    db: {
        user: 'story-messenger',
        host: 'postgres',
        password: 'test',
        port: 5432,
        database: 'story',
        schema: 'story',
    },
    http: {
        host: '0.0.0.0',
        port: 3002,
        path: '/story-example-api/v1',
    },
    ws: {
        host: '0.0.0.0',
        port: 9000,
    },
    rmq: {
        connect: {
            host: 'rabbitmq',
            port: 5672,
            user: 'test',
            password: 'test',
            queueName: 'cats',
        },
        consume: {
            exchange: 'cats',
            exchangeType: 'direct',
            exchangeDurable: false,
            bindPattern: 'cats_pattern',
            queue: 'cats',
            queueDurable: false,
            noAck: true,
            prefetchCount: 1,
            xMessageTtl: 10 * 60 * 1000,
            selfAck: true,
        },
        publish: {
            persistent: true,
            exchanges: {
                account: {
                    exchange: 'account',
                },
                message: {
                    exchange: 'message',
                },
            },
        },
    },
    token: {
        enabled: true,
        key: 'token-key',
        expiresIn: 60 * 1000,
    },
    filesAdapter: {
        maxSize: '4Mb',
        compression: true,
        protocols: {
            http: true,
            ws: false,
            rmq: false,
        },
        uploadsPath: '/story-photo-api/v1/uploads',
        downloadsPath: '/story-photo-api/v1/downloads',
    },
};
