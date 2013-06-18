# Transpiler

This is a [transpiler](https://en.wikipedia.org/wiki/Source-to-source_compiler)
which reads JavaScript, wraps all "function" constructs with
"ComponentJS.fn()" calls and outputs the resulting (and otherwise
fully unaltered) JavaScript code. This translation is necessary to
allow the [tracing plug-in](../plugins/) to correctly identify the *source*
of an API call within callback closures which are triggered by DOM
interactions or timers (because in these cases there is a fresh
stacktrace which cannot be used to trace back the source component the
closure belongs to).
