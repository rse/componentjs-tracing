expr
  = "true" _ ex1:expr1 { var t = { type: 'true' }; if (ex1.length === 0) { return t } else { ex1.left = t; return ex1 } }
  / "false" _ ex1:expr1 { var t = { type: 'false' }; if (ex1.length === 0) { return t } else { ex1.left = t; return ex1 } }
  / t:term _ ex1:expr1 { if (ex1.length !== 0) { ex1.left = t; return ex1 } else { return t } }
  / "(" _ ex:expr _ ")" _ ex1:expr1 { var t = { type: 'clasped', expression: ex }; if (ex1.length !== 0) { ex1.left = t; return ex1 } else { return t } }
  / "!" _ ex:expr _ ex1:expr1 { var t = { type: 'not', expression: ex }; if (ex1.length !== 0) { ex1.left = ex; return ex1 } else { return t } }

expr1
  = _ "&&" _ ex1:expr ex2:expr1 { return { type: 'and', right: ex1 } }
  / _ "||" _ ex1:expr ex2:expr1 { return { type: 'or', right: ex1 } }
  / _