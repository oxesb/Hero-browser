"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_core_1 = require("@ulixee/hero-core");
const CorePlugins_1 = require("@ulixee/hero-core/lib/CorePlugins");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const { log } = (0, Logger_1.default)(module);
class MirrorContext {
    static async createFromSessionDb(sessionId, headed = true) {
        const options = hero_core_1.Session.restoreOptionsFromSessionRecord({}, sessionId);
        delete options.resumeSessionId;
        delete options.resumeSessionStartLocation;
        options.showChromeInteractions = headed;
        options.showChrome = headed;
        const logger = log.createChild(module, { sessionId });
        const agent = hero_core_1.default.pool.createAgent({
            options,
            logger,
            deviceProfile: options?.userProfile?.deviceProfile,
            id: sessionId,
        });
        // eslint-disable-next-line no-new
        new CorePlugins_1.default(agent, {
            getSessionSummary() {
                return {
                    id: sessionId,
                    options,
                };
            },
        });
        return await agent.open();
    }
}
exports.default = MirrorContext;
//# sourceMappingURL=MirrorContext.js.map