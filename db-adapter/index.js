const {utils} = require('../utils');
const {logger} = require('../logger');
const {Client} = require('pg');
const {exec} = require('child_process');
const {DbError} = require('../errors');

class DbAdapter {
    constructor(config) {
        this.config = config;
        this.client = new Client(config);
        this.connectPostgres();
        this.runMigrations();
        this.setDbSearchPath();
    }

    async connectPostgres() {
        try {
            await this.client.connect();
            logger.info(`Connected to postgres (${this.config.host}:${this.config.port})`);
        } catch (err) {
            logger.info('postgres connect error', err.message);
            throw new DbError(err.message);
        }
    }

    async runMigrations() {
        if (!this.config.runMigrations) {
            logger.info('Migrations is disabled');
            return;
        }
        logger.info('Run migrations...');
        await exec(`/bin/sh ${__dirname}/migration-runner.sh`, (error, stdout, stderr) => {
            if (stdout) {
                logger.info(stdout);
            }
            if (stderr) {
                logger.info(stderr);
            }
            if (error !== null) {
                logger.error({'exec error': error});
            }
        });
    }

    async setDbSearchPath() {
        await this.client.query(`SET SEARCH_PATH = '${this.config.schema}'`);
    }

    async execQuery({queryName, params, options = {}}) {
        if (!queryName) {
            throw new DbError('Query in not defined');
        }

        const preparedQuery = this.getPreparedQuery(queryName, params);
        try {
            const result = await this.client.query(preparedQuery);
            return options.singularRow ? result.rows[0] : result.rows;
        } catch (err) {
            logger.error(err.message);
            throw new DbError(err.message);
        }
    }

    getPreparedQuery(query, params, unlock = true) {
        let text = query;
        if (unlock) {
            text = this.unlockParams(text, params);
        }

        const values = [];
        let paramNum = 0;
        text = text
            .replace(/\:(\w+)/g, (text, placeholder) => {
                if (utils.has(params, placeholder)) {
                    ++paramNum;
                    values.push(params[placeholder]);
                    return `$${paramNum}`;
                }

                return text;
            })
            .trim();

        return {text, values};
    }

    unlockParams(query, params) {
        let unlockedTemplate = query;

        for (const param in params) {
            if (utils.has(params, param)) {
                unlockedTemplate = this.unlockTemplate(unlockedTemplate, param);
            }
        }

        return unlockedTemplate;
    }

    unlockTemplate(query, templateName) {
        const pattern = new RegExp(`/\\*${templateName}:(.+?)\\*/`, 'gm');
        return query.replace(pattern, '$1');
    }
}

module.exports = {DbAdapter};
