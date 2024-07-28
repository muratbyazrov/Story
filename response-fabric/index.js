class ResponseFabric {
    build({domain, event, data, error}) {
        return {
            domain: domain || 'error',
            event: event || 'error',
            ...data && data,
            ...error && error,
        };
    }
}

module.exports = {responseFabric: new ResponseFabric()};
