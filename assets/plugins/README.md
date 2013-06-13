# ComponentJS Plug-ins
These are three crazy ComponentJS plug-ins designed to trace the
communication happening between different components of a target
application.

## Tracing Plug-in
The plug-in "component.plugin.tracing.js" hooks into ComponentJS
and traces all API calls in tuples of the following form:  
**< time, source, sourceType, origin, originType, operation, parameters >**  
By providing a hook itself, the plug-in enables other plug-ins
to process these traces.

## Console Plug-in
The plug-in "component.plugin.tracing-console.js" latches into the
previously mentioned hook, provided by the tracing plug-in and
simply prints the traces in textual form to the browser console.

## Remote Plug-in
The plug-in "component.plugin.tracing-remote.js" also latches
into the hook, defined by the tracing plug-in but this time sends
the traces to the main analysis program using websocket technology.