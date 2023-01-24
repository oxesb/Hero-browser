"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionDb_1 = require("../dbs/SessionDb");
function sessionResourcesApi(args) {
    const sessionDb = SessionDb_1.default.getCached(args.sessionId, true);
    const resources = sessionDb.resources.filter({
        hasResponse: args.omitWithoutResponse ?? true,
        isGetOrDocument: args.omitNonHttpGet ?? true,
    });
    return {
        resources,
    };
}
exports.default = sessionResourcesApi;
//# sourceMappingURL=Session.resources.js.map