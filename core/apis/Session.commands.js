"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCommandTimeline = void 0;
const CommandTimeline_1 = require("@ulixee/hero-timetravel/lib/CommandTimeline");
const SessionDb_1 = require("../dbs/SessionDb");
const CommandFormatter_1 = require("../lib/CommandFormatter");
const Session_1 = require("../lib/Session");
function sessionCommandsApi(args) {
    const timeline = loadCommandTimeline(args);
    const commandsWithResults = timeline.commands.map(CommandFormatter_1.default.parseResult);
    return {
        commands: commandsWithResults,
    };
}
exports.default = sessionCommandsApi;
function loadCommandTimeline(args) {
    Session_1.default.get(args.sessionId)?.db?.flush();
    const sessionDb = SessionDb_1.default.getCached(args.sessionId, true);
    return CommandTimeline_1.default.fromDb(sessionDb);
}
exports.loadCommandTimeline = loadCommandTimeline;
//# sourceMappingURL=Session.commands.js.map