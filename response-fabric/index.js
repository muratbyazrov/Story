class ResponseFabric {
    build({domain = 'error', event = 'error'}, data = {}) {
        const {isError, ..._data} = data;
        return isError ? {domain, event, error: _data} : {domain, event, data};
    }
}

module.exports = {responseFabric: new ResponseFabric()};
