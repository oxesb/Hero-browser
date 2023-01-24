"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class SessionsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'Sessions', [
            ['id', 'TEXT'],
            ['name', 'TEXT'],
            ['startDate', 'TEXT'],
            ['scriptInstanceId', 'TEXT'],
            ['scriptEntrypoint', 'TEXT'],
            ['scriptStartDate', 'TEXT'],
            ['workingDirectory', 'TEXT'],
        ]);
    }
    insert(session) {
        const { options, createdTime } = session;
        const { scriptInstanceMeta } = options;
        const record = [
            session.id,
            options.sessionName,
            new Date(createdTime).toISOString(),
            scriptInstanceMeta?.id,
            scriptInstanceMeta?.entrypoint,
            new Date(scriptInstanceMeta?.startDate).toISOString(),
            scriptInstanceMeta?.workingDirectory,
        ];
        this.insertNow(record);
    }
    findByName(name, scriptInstanceId) {
        const sql = `SELECT * FROM ${this.tableName} WHERE name=? AND scriptInstanceId=? ORDER BY scriptStartDate DESC, startDate DESC LIMIT 1`;
        return this.db.prepare(sql).get([name, scriptInstanceId]);
    }
    findByScriptEntrypoint(scriptEntrypoint, limit = 50) {
        const sql = `SELECT * FROM ${this.tableName} WHERE scriptEntrypoint=? ORDER BY scriptStartDate DESC, startDate DESC limit ${limit ?? 50}`;
        return this.db.prepare(sql).all([scriptEntrypoint]);
    }
}
exports.default = SessionsTable;
//# sourceMappingURL=SessionsTable.js.map