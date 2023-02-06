class Logger {
    info(data) {
        console.info(`(${new Date().toLocaleString()}) [INFO]: `, data);
    }

    error(error) {
        console.error(`(${new Date().toLocaleString()}) [ERROR]: `, error);
    }
}

module.exports = {logger: new Logger()};
