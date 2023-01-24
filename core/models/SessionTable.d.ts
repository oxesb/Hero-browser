import { Database as SqliteDatabase } from 'better-sqlite3';
import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import IDeviceProfile from '@ulixee/unblocked-specification/plugin/IDeviceProfile';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IScriptInstanceMeta from '@ulixee/hero-interfaces/IScriptInstanceMeta';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
export default class SessionTable extends SqliteTable<ISessionRecord> {
    private id;
    constructor(db: SqliteDatabase);
    insert(id: string, configuration: IHeroMeta, browserName: string, browserFullVersion: string, startDate: number, scriptInstanceMeta: IScriptInstanceMeta, deviceProfile: IDeviceProfile, createSessionOptions: any): void;
    updateConfiguration(configuration: IHeroMeta): void;
    close(closeDate: number): void;
    get(): ISessionRecord;
}
export interface ISessionRecord {
    id: string;
    name: string;
    renderingEngine: string;
    renderingEngineVersion: string;
    browserName: string;
    browserFullVersion: string;
    operatingSystemName: string;
    operatingSystemVersion: string;
    startDate: number;
    closeDate: number;
    scriptInstanceId: string;
    workingDirectory: string;
    scriptEntrypoint: string;
    scriptStartDate: number;
    userAgentString: string;
    viewport: IViewport;
    timezoneId: string;
    locale: string;
    publicIp?: string;
    proxyIp?: string;
    deviceProfile: IDeviceProfile;
    createSessionOptions: ISessionCreateOptions;
}
