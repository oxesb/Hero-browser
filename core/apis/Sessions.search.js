"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const SessionDb_1 = require("../dbs/SessionDb");
const CommandFormatter_1 = require("../lib/CommandFormatter");
function sessionsSearchApi(args) {
    const results = {
        sessions: [],
    };
    for (const dbName of Fs.readdirSync(SessionDb_1.default.databaseDir)) {
        if (!dbName.endsWith('.db'))
            continue;
        try {
            const sessionDb = new SessionDb_1.default(dbName.replace('.db', ''), {
                fileMustExist: true,
                readonly: true,
            });
            let didMatchDevtools = false;
            let didMatchCommands = false;
            const commands = sessionDb.commands.all();
            if (args.commandArg) {
                didMatchCommands = commands.some(x => x.args?.includes(args.commandArg));
            }
            if (args.devtoolsKey) {
                for (const msg of sessionDb.devtoolsMessages.all()) {
                    if (msg.params?.includes(args.devtoolsKey) ||
                        msg.result?.includes(args.devtoolsKey) ||
                        msg.error?.includes(args.devtoolsKey)) {
                        didMatchDevtools = true;
                        break;
                    }
                }
            }
            if (didMatchCommands || didMatchDevtools) {
                const session = sessionDb.session.get();
                const { id, name, startDate, closeDate } = session;
                results.sessions.push({
                    id,
                    name,
                    start: new Date(startDate),
                    end: new Date(closeDate),
                    commands: commands.map(x => CommandFormatter_1.default.toString(x)),
                    didMatchCommands,
                    didMatchDevtools,
                });
            }
        }
        catch (err) {
            // just ignore if db couldn't be opened
        }
    }
    return results;
}
exports.default = sessionsSearchApi;
//# sourceMappingURL=Sessions.search.js.map