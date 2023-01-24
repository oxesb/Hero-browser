"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const Fs = require("fs");
const SessionDb_1 = require("../dbs/SessionDb");
const CommandFormatter_1 = require("../lib/CommandFormatter");
function sessionsFindWithErrorsApi() {
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
            const session = sessionDb.session.get();
            const { id, name, startDate, closeDate } = session;
            const result = {
                id,
                name,
                start: new Date(startDate),
                end: new Date(closeDate),
                commandsWithErrors: [],
                logErrors: [],
            };
            const commands = sessionDb.commands.all();
            let i = 0;
            for (const command of commands) {
                const { resultType } = command;
                const isLastCommand = i === commands.length - 1;
                if (resultType === 'TimeoutError') {
                    result.commandsWithErrors.push({
                        label: CommandFormatter_1.default.toString(command),
                        date: new Date(command.endDate),
                        didTimeout: true,
                        wasCanceled: false,
                        isLastCommand,
                    });
                }
                else if (resultType === 'CanceledPromiseError') {
                    result.commandsWithErrors.push({
                        label: CommandFormatter_1.default.toString(command),
                        date: new Date(command.endDate),
                        didTimeout: false,
                        wasCanceled: true,
                        isLastCommand,
                    });
                }
                i += 1;
            }
            result.logErrors = sessionDb.sessionLogs.allErrors().map(x => {
                const error = TypeSerializer_1.default.parse(x.data);
                return {
                    date: new Date(x.timestamp),
                    action: x.action,
                    path: x.module,
                    error: error.clientError ?? error.error ?? error,
                };
            });
            if (result.logErrors.length || result.commandsWithErrors.length) {
                results.sessions.push(result);
            }
        }
        catch (err) {
            // just ignore if db couldn't be opened
        }
    }
    return results;
}
exports.default = sessionsFindWithErrorsApi;
//# sourceMappingURL=Sessions.findWithErrors.js.map