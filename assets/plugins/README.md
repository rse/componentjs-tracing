
These are two crazy ComponentJS plugins: "component.plugin.tracing.js"
hooks into ComponentJS and traces all API calls in the form
of "< time, source, sourceType, origin, originType, operation,
parameters >" tuples and emits the tuples again through a hook. The
"component.plugin.tracing-console.js" is a companion plugin which
latches into this hook to gather all emitted tuples and just print them
in textual form to the browser console.

