"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Database = require("better-sqlite3");
const fs = require("fs");
const SessionsTable_1 = require("../models/SessionsTable");
const index_1 = require("../index");
class SessionsDb {
    constructor(dbOptions = {}) {
        SessionsDb.createDir();
        const { readonly = false, fileMustExist = false } = dbOptions;
        this.db = new Database(SessionsDb.databasePath, { readonly, fileMustExist });
        this.db.unsafeMode(false);
        this.db.pragma('journal_mode = WAL');
        this.readonly = readonly;
        this.sessions = new SessionsTable_1.default(this.db);
    }
    findLatestSessionId(script) {
        const { sessionName, scriptEntrypoint, scriptInstanceId } = script;
        if (sessionName && scriptInstanceId) {
            // find default session if current not available
            const sessionRecord = this.sessions.findByName(sessionName, scriptInstanceId) ??
                this.sessions.findByName('default-session', scriptInstanceId);
            return sessionRecord?.id;
        }
        if (scriptEntrypoint) {
            const sessionRecords = this.sessions.findByScriptEntrypoint(scriptEntrypoint);
            if (!sessionRecords.length)
                return undefined;
            return sessionRecords[0].id;
        }
    }
    findRelatedSessions(session) {
        const otherSessions = this.sessions.findByScriptEntrypoint(session.scriptEntrypoint);
        const relatedScriptInstances = [];
        const relatedSessions = [];
        const scriptDates = new Set();
        for (const otherSession of otherSessions) {
            const key = `${otherSession.scriptInstanceId}_${otherSession.scriptStartDate}`;
            if (!scriptDates.has(key)) {
                relatedScriptInstances.push({
                    id: otherSession.scriptInstanceId,
                    startDate: new Date(otherSession.scriptStartDate).getTime(),
                    defaultSessionId: otherSession.id,
                });
            }
            if (otherSession.scriptInstanceId === session.scriptInstanceId) {
                relatedSessions.unshift({ id: otherSession.id, name: otherSession.name });
            }
            scriptDates.add(key);
        }
        return {
            relatedSessions,
            relatedScriptInstances,
        };
    }
    recordSession(session) {
        if (!session.options?.scriptInstanceMeta)
            return;
        this.sessions.insert(session);
    }
    close() {
        if (this.db) {
            this.db.close();
        }
        this.db = null;
        SessionsDb.instance = undefined;
    }
    static shutdown() {
        this.instance?.close();
        this.instance = undefined;
    }
    static find() {
        this.instance = this.instance || new SessionsDb();
        return this.instance;
    }
    static createDir() {
        if (!this.hasInitialized) {
            fs.mkdirSync(this.databaseDir, { recursive: true });
            this.hasInitialized = true;
        }
    }
    static get databaseDir() {
        return `${index_1.default.dataDir}`;
    }
    static get databasePath() {
        return `${this.databaseDir}/hero-sessions.db`;
    }
}
exports.default = SessionsDb;
SessionsDb.hasInitialized = false;
//# sourceMappingURL=SessionsDb.js.map