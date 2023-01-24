"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionDb_1 = require("../dbs/SessionDb");
function sessionFindApi(lookup) {
    const sessionLookup = SessionDb_1.default.find(lookup);
    if (!sessionLookup) {
        throw new Error(`No sessions found with the given lookup parameters (${JSON.stringify(lookup, (key, value) => value, 2)})`);
    }
    return sessionLookup;
}
exports.default = sessionFindApi;
//# sourceMappingURL=Session.find.js.map