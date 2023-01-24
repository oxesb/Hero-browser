"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionDb_1 = require("../dbs/SessionDb");
function sessionDomChangesApi(args) {
    var _a, _b;
    const sessionDb = SessionDb_1.default.getCached(args.sessionId, true);
    const changes = sessionDb.domChanges.all();
    const result = {
        domChangesByTabId: {},
    };
    for (const change of changes) {
        (_a = result.domChangesByTabId)[_b = change.tabId] ?? (_a[_b] = []);
        result.domChangesByTabId[change.tabId].push(change);
    }
    for (const list of Object.values(result.domChangesByTabId)) {
        list.sort((a, b) => {
            if (a.timestamp === b.timestamp) {
                if (a.frameId === b.frameId) {
                    return a.eventIndex - b.eventIndex;
                }
                return a.frameId - b.frameId;
            }
            return a.timestamp - b.timestamp;
        });
    }
    return result;
}
exports.default = sessionDomChangesApi;
//# sourceMappingURL=Session.domChanges.js.map