import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { Session } from '../index';
export default class SessionsTable extends SqliteTable<ISessionsRecord> {
    constructor(db: SqliteDatabase);
    insert(session: Session): void;
    findByName(name: string, scriptInstanceId: string): ISessionsRecord;
    findByScriptEntrypoint(scriptEntrypoint: any, limit?: number): ISessionsRecord[];
}
export interface ISessionsRecord {
    id: string;
    name: string;
    startDate: string;
    scriptInstanceId: string;
    scriptEntrypoint: string;
    scriptStartDate: string;
    workingDirectory: string;
}
