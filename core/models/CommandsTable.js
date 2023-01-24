"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
class CommandsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'Commands', [
            ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['retryNumber', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['tabId', 'INTEGER'],
            ['frameId', 'INTEGER'],
            ['flowCommandId', 'INTEGER'],
            ['activeFlowHandlerId', 'INTEGER'],
            ['name', 'TEXT'],
            ['args', 'TEXT'],
            ['clientStartDate', 'INTEGER'],
            ['clientSendDate', 'INTEGER'],
            ['runStartDate', 'INTEGER'],
            ['endDate', 'INTEGER'],
            ['result', 'TEXT'],
            ['resultType', 'TEXT'],
            ['callsite', 'TEXT'],
        ], true);
        this.defaultSortOrder = 'id ASC';
    }
    insert(commandMeta) {
        commandMeta.resultType = commandMeta.result?.constructor?.name ?? typeof commandMeta.result;
        this.queuePendingInsert([
            commandMeta.id,
            commandMeta.retryNumber ?? 0,
            commandMeta.tabId,
            commandMeta.frameId,
            commandMeta.flowCommandId,
            commandMeta.activeFlowHandlerId,
            commandMeta.name,
            commandMeta.args,
            commandMeta.clientStartDate,
            commandMeta.clientSendDate,
            commandMeta.runStartDate,
            commandMeta.endDate,
            TypeSerializer_1.default.stringify(commandMeta.result),
            commandMeta.resultType,
            commandMeta.callsite ? JSON.stringify(commandMeta.callsite) : undefined,
        ]);
    }
}
exports.default = CommandsTable;
//# sourceMappingURL=CommandsTable.js.map