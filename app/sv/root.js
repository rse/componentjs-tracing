/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2013 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

module.paths = module.paths.concat(module.parent.paths);

module.exports = {
    setup: function (ctx, opts) {

        require("./proxy.js").setup(ctx, opts)
        require("./websocket.js").setup(ctx, opts)

        return null
    }
}

