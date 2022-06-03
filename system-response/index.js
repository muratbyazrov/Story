class SystemResponse {
    form({domain = 'error', event = 'error'}, data) {
        const {isError, ..._data} = data;
        return isError ? {status: 'error', domain, event, error: _data} : {status: 'ok', domain, event, data};
    }
}

module.exports = {systemResponse: new SystemResponse()};
