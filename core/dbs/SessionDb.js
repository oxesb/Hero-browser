"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Database = require("better-sqlite3");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Fs = require("fs");
const ResourcesTable_1 = require("../models/ResourcesTable");
const DomChangesTable_1 = require("../models/DomChangesTable");
const CommandsTable_1 = require("../models/CommandsTable");
const WebsocketMessagesTable_1 = require("../models/WebsocketMessagesTable");
const FrameNavigationsTable_1 = require("../models/FrameNavigationsTable");
const FramesTable_1 = require("../models/FramesTable");
const PageLogsTable_1 = require("../models/PageLogsTable");
const SessionTable_1 = require("../models/SessionTable");
const MouseEventsTable_1 = require("../models/MouseEventsTable");
const FocusEventsTable_1 = require("../models/FocusEventsTable");
const ScrollEventsTable_1 = require("../models/ScrollEventsTable");
const SessionLogsTable_1 = require("../models/SessionLogsTable");
const ScreenshotsTable_1 = require("../models/ScreenshotsTable");
const SessionsDb_1 = require("./SessionsDb");
const DevtoolsMessagesTable_1 = require("../models/DevtoolsMessagesTable");
const TabsTable_1 = require("../models/TabsTable");
const ResourceStatesTable_1 = require("../models/ResourceStatesTable");
const SocketsTable_1 = require("../models/SocketsTable");
const index_1 = require("../index");
const StorageChangesTable_1 = require("../models/StorageChangesTable");
const AwaitedEventsTable_1 = require("../models/AwaitedEventsTable");
const DetachedElementsTable_1 = require("../models/DetachedElementsTable");
const SnippetsTable_1 = require("../models/SnippetsTable");
const DetachedResourcesTable_1 = require("../models/DetachedResourcesTable");
const OutputTable_1 = require("../models/OutputTable");
const FlowHandlersTable_1 = require("../models/FlowHandlersTable");
const FlowCommandsTable_1 = require("../models/FlowCommandsTable");
const InteractionStepsTable_1 = require("../models/InteractionStepsTable");
const { log } = (0, Logger_1.default)(module);
class SessionDb {
    constructor(sessionId, dbOptions = {}) {
        this.keepAlive = false;
        this.tables = [];
        SessionDb.createDir();
        const { readonly = false, fileMustExist = false } = dbOptions;
        this.sessionId = sessionId;
        this.path = `${SessionDb.databaseDir}/${sessionId}.db`;
        this.db = new Database(this.path, { readonly, fileMustExist });
        if (dbOptions?.enableWalMode) {
            this.db.unsafeMode(false);
            this.db.pragma('journal_mode = WAL');
        }
        if (!readonly) {
            this.saveInterval = setInterval(this.flush.bind(this), 5e3).unref();
        }
        this.commands = new CommandsTable_1.default(this.db);
        this.tabs = new TabsTable_1.default(this.db);
        this.frames = new FramesTable_1.default(this.db);
        this.frameNavigations = new FrameNavigationsTable_1.default(this.db);
        this.sockets = new SocketsTable_1.default(this.db);
        this.resources = new ResourcesTable_1.default(this.db);
        this.resourceStates = new ResourceStatesTable_1.default(this.db);
        this.websocketMessages = new WebsocketMessagesTable_1.default(this.db);
        this.domChanges = new DomChangesTable_1.default(this.db);
        this.detachedElements = new DetachedElementsTable_1.default(this.db);
        this.detachedResources = new DetachedResourcesTable_1.default(this.db);
        this.snippets = new SnippetsTable_1.default(this.db);
        this.flowHandlers = new FlowHandlersTable_1.default(this.db);
        this.flowCommands = new FlowCommandsTable_1.default(this.db);
        this.pageLogs = new PageLogsTable_1.default(this.db);
        this.session = new SessionTable_1.default(this.db);
        this.interactions = new InteractionStepsTable_1.default(this.db);
        this.mouseEvents = new MouseEventsTable_1.default(this.db);
        this.focusEvents = new FocusEventsTable_1.default(this.db);
        this.scrollEvents = new ScrollEventsTable_1.default(this.db);
        this.sessionLogs = new SessionLogsTable_1.default(this.db);
        this.screenshots = new ScreenshotsTable_1.default(this.db);
        this.storageChanges = new StorageChangesTable_1.default(this.db);
        this.devtoolsMessages = new DevtoolsMessagesTable_1.default(this.db);
        this.awaitedEvents = new AwaitedEventsTable_1.default(this.db);
        this.output = new OutputTable_1.default(this.db);
        this.tables.push(this.commands, this.tabs, this.frames, this.frameNavigations, this.sockets, this.resources, this.resourceStates, this.websocketMessages, this.domChanges, this.detachedElements, this.detachedResources, this.snippets, this.flowHandlers, this.flowCommands, this.pageLogs, this.session, this.interactions, this.mouseEvents, this.focusEvents, this.scrollEvents, this.sessionLogs, this.devtoolsMessages, this.screenshots, this.storageChanges, this.awaitedEvents, this.output);
        if (!readonly) {
            this.batchInsert = this.db.transaction(() => {
                for (const table of this.tables) {
                    try {
                        table.runPendingInserts();
                    }
                    catch (error) {
                        if (String(error).match('attempt to write a readonly database')) {
                            clearInterval(this.saveInterval);
                            this.db = null;
                        }
                        log.error('SessionDb.flushError', {
                            sessionId: this.sessionId,
                            error: String(error),
                            table: table.tableName,
                        });
                    }
                }
            });
        }
    }
    get readonly() {
        return this.db?.readonly;
    }
    get isOpen() {
        return this.db?.open;
    }
    async close(deleteFile = false) {
        clearInterval(this.saveInterval);
        if (this.db?.open) {
            this.flush();
        }
        if (this.keepAlive) {
            this.db.readonly = true;
            return;
        }
        SessionDb.byId.delete(this.sessionId);
        this.db.close();
        if (deleteFile) {
            await Fs.promises.rm(this.path);
        }
        this.db = null;
    }
    flush() {
        if (this.batchInsert) {
            try {
                this.batchInsert.immediate();
            }
            catch (error) {
                if (String(error).match(/attempt to write a readonly database/) ||
                    String(error).match(/database is locked/)) {
                    clearInterval(this.saveInterval);
                }
                throw error;
            }
        }
    }
    static getCached(sessionId, fileMustExist = false) {
        if (sessionId.endsWith('.db'))
            sessionId = sessionId.split('.db').shift();
        if (!this.byId.get(sessionId)?.db?.open) {
            this.byId.set(sessionId, new SessionDb(sessionId, {
                readonly: true,
                fileMustExist,
            }));
        }
        return this.byId.get(sessionId);
    }
    static find(scriptArgs) {
        let { sessionId } = scriptArgs;
        if (sessionId?.endsWith('.db'))
            sessionId = sessionId.split('.db').shift();
        // NOTE: don't close db - it's from a shared cache
        const sessionsDb = SessionsDb_1.default.find();
        if (!sessionId) {
            sessionId = sessionsDb.findLatestSessionId(scriptArgs);
            if (!sessionId)
                return null;
        }
        const sessionDb = this.getCached(sessionId, true);
        const session = sessionDb.session.get();
        return {
            session,
        };
    }
    static createDir() {
        if (!this.hasInitialized) {
            Fs.mkdirSync(this.databaseDir, { recursive: true });
            this.hasInitialized = true;
        }
    }
    static get databaseDir() {
        return `${index_1.default.dataDir}/hero-sessions`;
    }
}
exports.default = SessionDb;
SessionDb.byId = new Map();
SessionDb.hasInitialized = false;
//# sourceMappingURL=SessionDb.js.map