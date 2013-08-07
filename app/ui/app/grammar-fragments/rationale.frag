rationale
  = "rationale" _ "{" _ text:([^}]*) "}" _ { return text.join('').trim() }
