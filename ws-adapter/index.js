const WebSocket = require('ws');
const {v4} = require('uuid');

class WsAdapter {
    constructor(options) {
        this.config = options.ws;
        this.wsClients = new Map();
    }

    run(callback) {
        this.wsServer = new WebSocket.Server({...this.config});
        try {
            this.wsServer.on('connection', wsClient => {
                // 1. connect
                const sessionId = v4();
                console.log(`SYSTEM [INFO]: WS client ${sessionId} is connected`);
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
                    console.log(`SYSTEM [INFO]: WS client ${sessionId} is disconnected`);
                });
            });
        } catch (error) {
            console.log(`SYSTEM [ERROR]: ${error.message}`);
        }
    }

    async send(sessionId = null, message = {}) {
        // добавить проверку на то, что ws клиент создан или существует (после перезагрузки клиенты стираются)
        const wsClient = this.wsClients.get(sessionId);
        await wsClient.send(JSON.stringify(message));
    }
}

module.exports = {
    WsAdapter,
};
