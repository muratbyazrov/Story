const WebSocket = require('ws');
const {v4} = require('uuid');
const {logger} = require("../logger");
const {response} = require("../response");
const {NotFoundError} = require("../errors");

class WsAdapter {
    constructor(config) {
        this.config = config;
        this.wsClients = new Map();
    }

    run(callback) {
        this.wsServer = new WebSocket.Server({...this.config});
        try {
            this.wsServer.on('connection', wsClient => {
                // 1. connect
                const sessionId = v4();
                logger.info(`WS client ${sessionId} is connected`)
                wsClient.send(JSON.stringify({sessionId}));
                this.wsClients.set(sessionId, wsClient);

                // 2. callback
                try {
                    wsClient.on('message', async message => {
                        wsClient.send(JSON.stringify(await callback(message.toString())));
                    });
                } catch (error) {
                    wsClient.send(`${new Date().toLocaleString()} | ${error.message}`);
                }

                // 3. disconnect
                wsClient.on('close', () => {
                    this.wsClients.delete(wsClient);
                    logger.info(`WS client ${sessionId} is disconnected`);
                });
            });
        } catch (error) {
            logger.error(error.message);
        }
    }

    async send(message, {sessionId = null, domain = 'story', event = 'story-method'}) {
        try {
            const wsClients = sessionId ? [this.wsClients.get(sessionId)] : [...this.wsClients.keys()];
            if (!wsClients.length) {
                throw new NotFoundError('No ws-clients to send the message')
            }
            logger.info({[`Send WS message to ${sessionId}`]: message});

            const msg = response.format({domain, event}, message);
            for (const wsClient of wsClients) {
                wsClient && await wsClient.send(JSON.stringify(msg));
            }
        } catch (error) {
            logger.error(error.message);
        }
    }
}

module.exports = {
    WsAdapter,
};
