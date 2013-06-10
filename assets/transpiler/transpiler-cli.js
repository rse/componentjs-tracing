/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  external requirements  */
var tracing = require("./transpiler-lib.js").tracing;
var fs = require("fs");

/*  command-line arguments  */
var filename_src
var filename_dst = process.argv[3];
if (process.argv[2] !== '-i') {
	filename_src = process.argv[2];
} else {
	filename_src = filename_dst;
}

/*  read original source, instrument it and write instrumented source  */
var source = fs.readFileSync(filename_src, { encoding: "utf8" });
source = tracing.instrument("cs", source);
fs.writeFileSync(filename_dst, source, { encoding: "utf8" });

