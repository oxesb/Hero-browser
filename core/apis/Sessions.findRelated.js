"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionDb_1 = require("../dbs/SessionDb");
const SessionsDb_1 = require("../dbs/SessionsDb");
function sessionsFindRelatedApi(args) {
    // NOTE: don't close db - it's from a shared cache
    const sessionsDb = SessionsDb_1.default.find();
    const sessionDb = SessionDb_1.default.getCached(args.sessionId, true);
    const session = sessionDb.session.get();
    return sessionsDb.findRelatedSessions(session);
}
exports.default = sessionsFindRelatedApi;
//# sourceMappingURL=Sessions.findRelated.js.map