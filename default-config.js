module.exports = {
    db: {
        user: 'db-story-user',
        host: 'postgres',
        password: 'test',
        port: 5432,
        database: 'story-database',
        schema: 'story-schema',
    },
    http: {
        host: 'http-story-host',
        port: 3000,
        path: '/story-example-api/v1',
    },
    ws: {
        host: '192.168.100.142',
        port: 9005,
    },
    rmq: {
        connect: {
            host: 'rabbitmq',
            port: 5672,
            user: 'story',
            password: 'test',
            queueName: 'story-queue',
        },
        consume: {
            exchange: 'cats',
            exchangeType: 'fanout',
            exchangeDurable: false,
            bindPattern: 'story_pattern',
            queue: 'story',
            queueDurable: false,
            noAck: false,
            prefetchCount: 1,
            xMessageTtl: 10 * 60 * 1000,
            selfAck: true,
        },
        publish: {
            persistent: true,
            exchanges: {
                storyExchange_1: {
                    exchange: 'story-exchange',
                    routingKey: 'story-routing-key',
                },
                storyExchange_2: {
                    exchange: 'story-exchange',
                    routingKey: 'story-routing-key',
                },
            },
        },
    },
    token: {
        enabled: true,
        key: 'story-key',
        expiresIn: 24 * 60 * 60 * 1000,
        algorithm: 'HS256',
        uncheckMethods: {
            storyDomain: ['method_1', 'method_2'],
        },
    },
    filesAdapter: {
        maxFileSizeMb: 10,
        createPath: '/story-api/v1/create',
        getPath: '/story-api/v1/get',
        destination: `${__dirname}/uploads`,
        imagesCompression: {
            widthPx: null,
            heightPx: null,
        },
        protocols: {
            http: false,
            ws: false,
            rmq: false,
        },
    },
};
