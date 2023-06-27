class Logger {
    info(data) {
        const {token = '***', ..._data} = data;
        console.info(`(${new Date().toLocaleString()}) [INFO]: `, {token, _data});
    }

    error(error) {
        console.error(`(${new Date().toLocaleString()}) [ERROR]: `, error);
    }
}

module.exports = {logger: new Logger()};
