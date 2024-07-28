class ResponseFabric {
    build({domain, event, data, error}) {
        return {
            domain: domain || 'error',
            event: event || 'error',
            data,
            error,
        };
    }
}

module.exports = {responseFabric: new ResponseFabric()};
