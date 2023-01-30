class Response {
    format({domain = 'error', event = 'error'}, data) {
        const {isError, ..._data} = data;
        return isError ? {domain, event, error: _data} : {domain, event, data};
    }
}

module.exports = {response: new Response()};
