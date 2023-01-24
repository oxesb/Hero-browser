"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Database = require("better-sqlite3");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const fs = require("fs");
const CertificatesTable_1 = require("../models/CertificatesTable");
const index_1 = require("../index");
const { log } = (0, Logger_1.default)(module);
class NetworkDb {
    constructor(options) {
        this.tables = [];
        NetworkDb.createDir();
        this.db = new Database(NetworkDb.databasePath);
        this.certificates = new CertificatesTable_1.default(this.db);
        this.saveInterval = setInterval(this.flush.bind(this), 5e3).unref();
        if (options?.enableSqliteWAL) {
            this.db.unsafeMode(false);
            this.db.pragma('journal_mode = WAL');
        }
        this.tables = [this.certificates];
        this.batchInsert = this.db.transaction(() => {
            for (const table of this.tables) {
                try {
                    table.runPendingInserts();
                }
                catch (error) {
                    if (String(error).match(/attempt to write a readonly database/) ||
                        String(error).match(/database is locked/)) {
                        clearInterval(this.saveInterval);
                        this.db = null;
                    }
                    log.error('NetworkDb.flushError', {
                        sessionId: null,
                        error,
                        table: table.tableName,
                    });
                }
            }
        });
    }
    close() {
        if (this.db) {
            clearInterval(this.saveInterval);
            this.flush();
            this.db.close();
        }
        this.db = null;
    }
    flush() {
        if (!this.db || this.db.readonly)
            return;
        this.batchInsert.immediate();
    }
    static createDir() {
        if (!this.hasInitialized) {
            fs.mkdirSync(this.databaseDir, { recursive: true });
            this.hasInitialized = true;
        }
    }
    static get databaseDir() {
        return index_1.default.dataDir;
    }
    static get databasePath() {
        return `${this.databaseDir}/network.db`;
    }
}
exports.default = NetworkDb;
NetworkDb.hasInitialized = false;
//# sourceMappingURL=NetworkDb.js.map