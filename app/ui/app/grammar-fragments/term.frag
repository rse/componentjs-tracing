term
  = f:field _ o:op _ v:value { return { type: 'term', op: o, field: f, value: v } }
  / f1:field _ o:op _ f2:field { return { type: 'term', op: o, field1: f1, field2: f2 } }
  / f:function _ "(" _ p:params _ ")" _ o:op _ v:value _ { return { type: 'term', op: o, function: f, params: p, value: v } }
  / f:function _ "(" _ p:params _ ")" _ { return { type: 'function', name: f, params: p } }

 params
  = first:field _ fields:("," _ field)* _ { var tmp = [first];for (var i = 0; i < fields.length; i++) { if (i % 2 == 0) { tmp.push(fields[i][fields[i].length-1])} }; return tmp }

function
  = "isParent"
  / "distance"

field
  = first:id ids:("." id)* _ { var ary = [first]; for(var i = 0; i < ids.length; i++) { ary.push(ids[i][ids[i].length - 1]) }; return ary }

value
  = "true"
  / "false"
  / "undefined" { return { type: 'value', value: 'undefined' } }
  / '"' content:( '\\"' / [^"])* '"' { return '"' + content.join('') + '"' }
  / "'" content:( '\\\'' / [^'])* "'" { return '"' + content.join('') + '"' }
  / num:$([0-9]+(.[0-9]+)?) { return num }
  / '/' content:('\\/' / [^/])* '/' { return { type: 'regex', value: '/' + content.join('').replace(/\\//g, '/') + '/' } }

op
  = "=="
  / "!="
  / "<="
  / ">="
  / "<"
  / ">"
  / "=~"
  / "!~"
