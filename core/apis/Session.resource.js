"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionDb_1 = require("../dbs/SessionDb");
function sessionResourceApi(args) {
    const sessionDb = SessionDb_1.default.getCached(args.sessionId, true);
    const resource = sessionDb.resources.getResponse(args.resourceId);
    if (resource) {
        const headers = JSON.parse(resource.responseHeaders ?? '{}');
        return {
            resource: {
                statusCode: resource.statusCode,
                headers,
                body: resource.responseData,
            },
        };
    }
    return {
        resource: {
            statusCode: 404,
            headers: {},
            body: null,
        },
    };
}
exports.default = sessionResourceApi;
//# sourceMappingURL=Session.resource.js.map