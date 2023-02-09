const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {logger} = require("../logger");

class HttpAdapter {
    constructor(options) {
        this.config = options;
    }

    run(callback) {
        app.listen(this.config.port, this.config.host, () => {
            logger.info(`App listening http ${this.config.host}${this.config.port}`);
        });
        app.use(bodyParser.json());
        app.post(this.config.path, async (req, res) => {
            try {
                res.send(await callback(req.body));
            } catch (err) {
                res.send(err);
            }
        });
    }
}

module.exports = {
    HttpAdapter,
};
