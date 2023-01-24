"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class SessionTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'Session', [
            ['id', 'TEXT'],
            ['name', 'TEXT'],
            ['browserName', 'TEXT'],
            ['browserFullVersion', 'TEXT'],
            ['operatingSystemName', 'TEXT'],
            ['operatingSystemVersion', 'TEXT'],
            ['renderingEngine', 'TEXT'],
            ['renderingEngineVersion', 'TEXT'],
            ['startDate', 'INTEGER'],
            ['closeDate', 'INTEGER'],
            ['scriptInstanceId', 'TEXT'],
            ['workingDirectory', 'TEXT'],
            ['scriptEntrypoint', 'TEXT'],
            ['scriptStartDate', 'INTEGER'],
            ['userAgentString', 'TEXT'],
            ['viewport', 'TEXT'],
            ['deviceProfile', 'TEXT'],
            ['timezoneId', 'TEXT'],
            ['locale', 'TEXT'],
            ['publicIp', 'TEXT'],
            ['proxyIp', 'TEXT'],
            ['createSessionOptions', 'TEXT'],
        ], true);
    }
    insert(id, configuration, browserName, browserFullVersion, startDate, scriptInstanceMeta, deviceProfile, createSessionOptions) {
        this.id = id;
        const record = [
            this.id,
            configuration.sessionName,
            browserName,
            browserFullVersion,
            configuration.operatingSystemName,
            configuration.operatingSystemVersion,
            configuration.renderingEngine,
            configuration.renderingEngineVersion,
            startDate,
            null,
            scriptInstanceMeta?.id,
            scriptInstanceMeta?.workingDirectory,
            scriptInstanceMeta?.entrypoint,
            scriptInstanceMeta?.startDate,
            configuration.userAgentString,
            JSON.stringify(configuration.viewport),
            JSON.stringify(deviceProfile),
            configuration.timezoneId,
            configuration.locale,
            configuration.upstreamProxyIpMask?.publicIp,
            configuration.upstreamProxyIpMask?.proxyIp,
            JSON.stringify(createSessionOptions),
        ];
        this.insertNow(record);
    }
    updateConfiguration(configuration) {
        const toUpdate = {
            viewport: JSON.stringify(configuration.viewport),
            timezoneId: configuration.timezoneId,
            locale: configuration.locale,
            publicIp: configuration.upstreamProxyIpMask?.publicIp,
            proxyIp: configuration.upstreamProxyIpMask?.proxyIp,
        };
        this.db
            .prepare(`UPDATE ${this.tableName} SET viewport=:viewport, timezoneId=:timezoneId, locale=:locale, publicIp=:publicIp, proxyIp=:proxyIp WHERE id=?`)
            .run(this.id, toUpdate);
        if (this.insertCallbackFn)
            this.insertCallbackFn([]);
    }
    close(closeDate) {
        const values = [closeDate, this.id];
        const fields = ['closeDate'];
        const sql = `UPDATE ${this.tableName} SET ${fields.map(n => `${n}=?`).join(', ')} WHERE id=?`;
        this.db.prepare(sql).run(...values);
        if (this.insertCallbackFn)
            this.insertCallbackFn([]);
    }
    get() {
        const record = this.db.prepare(`select * from ${this.tableName}`).get();
        record.createSessionOptions = JSON.parse(record.createSessionOptions);
        record.viewport = JSON.parse(record.viewport ?? 'undefined');
        record.deviceProfile = JSON.parse(record.deviceProfile ?? 'undefined');
        return record;
    }
}
exports.default = SessionTable;
//# sourceMappingURL=SessionTable.js.map