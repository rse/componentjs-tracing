
These are three crazy ComponentJS plug-ins: "component.plugin.tracing.js"
hooks into ComponentJS and traces all API calls in the form
of "< time, source, sourceType, origin, originType, operation,
parameters >" tuples and emits the tuples again through a hook. The
"component.plugin.tracing-console.js" is a companion plug-in which
latches into this hook to gather all emitted tuples and just print them
in textual form to the browser console. The third plug-in
"component.plugin.tracing-remote.js" also latches into the hook,
provided by the tracing plug-in but this time sends the traces to the
main application using websocket technology.