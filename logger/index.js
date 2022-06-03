class Logger {
    log(data) {
        console.error(`(${new Date().toLocaleString()}) LOGGER [INFO]: `, data);
    }

    error(error) {
        console.error(`(${new Date().toLocaleString()}) LOGGER [ERROR]: `, error);
    }
}

module.exports = {logger: new Logger()};
