window.tracingMessage = function (trace) {
    cs('/ui/panel/panel/panel/tracing').publish('receivedTrace', trace)
}