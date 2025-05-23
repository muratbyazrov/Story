const {utils} = require('../utils');
const {logger} = require('../logger');
const {Pool} = require('pg');
const {exec} = require('child_process');
const {DbError} = require('../errors');

class DbAdapter {
    constructor(config) {
        this.config = config;
        this.pool = new Pool(config);
        this.runMigrations();
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

    async execQuery({queryName, params, options = {}}) {
        if (!queryName) {
            throw new DbError('Query is not defined');
        }

        const preparedQuery = this.getPreparedQuery(queryName, params);

        try {
            const client = await this.pool.connect();
            try {
                await client.query(`SET SEARCH_PATH = '${this.config.schema}'`);
                const result = await client.query(preparedQuery);
                return options.singularRow ? result.rows[0] : result.rows;
            } finally {
                client.release();
            }
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
