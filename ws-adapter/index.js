const WebSocket = require('ws');
const {v4} = require('uuid');
const {logger} = require("../logger");
const {response} = require("../response");

class WsAdapter {
    constructor(options) {
        this.config = options;
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

    async send(message, {sessionId = null, domain = 'ws', event = 'ws'}) {
        const wsClient = this.wsClients.get(sessionId);
        logger.info({[`Send WS message to ${sessionId}`]: message});
        try {
            const msg = response.format({domain, event}, message);
            wsClient && await wsClient.send(JSON.stringify(msg));
            logger.info(`message sent to ${sessionId}`)
        } catch (error) {
            logger.error(error.message);
        }
    }
}

module.exports = {
    WsAdapter,
};
