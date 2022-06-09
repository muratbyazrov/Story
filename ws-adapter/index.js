const WebSocket = require('ws');
const {v4} = require('uuid');

class WsAdapter {
    constructor(options) {
        this.options = options;
        this.wsClients = new Map();
    }

    run(callback) {
        const {ws: wsConfig, domain} = this.options;
        this.wsServer = new WebSocket.Server({...wsConfig});
        try {
            this.wsServer.on('connection', wsClient => {
                // 1. connect
                const sessionId = v4();
                console.log(`SYSTEM [INFO]: WS client ${sessionId} is connected`);
                wsClient.send(JSON.stringify({domain, sessionId}));
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
                    console.log(`SYSTEM [INFO]: WS client ${sessionId} is disconnected`);
                });
            });
        } catch (error) {
            console.log(`SYSTEM [ERROR]: ${error.message}`);
        }
    }

    async send(sessionId = null, message = {}) {
        const wsClient = this.wsClients.get(sessionId);
        wsClient && await wsClient.send(JSON.stringify(message));
    }
}

module.exports = {
    WsAdapter,
};
