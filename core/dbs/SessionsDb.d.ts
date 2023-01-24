import SessionsTable from '../models/SessionsTable';
import Session from '../lib/Session';
interface IDbOptions {
    readonly?: boolean;
    fileMustExist?: boolean;
}
export default class SessionsDb {
    private static instance;
    private static hasInitialized;
    readonly sessions: SessionsTable;
    readonly readonly: boolean;
    private db;
    constructor(dbOptions?: IDbOptions);
    findLatestSessionId(script: {
        sessionName?: string;
        scriptInstanceId?: string;
        scriptEntrypoint?: string;
    }): string;
    findRelatedSessions(session: {
        scriptEntrypoint: string;
        scriptInstanceId: string;
    }): ISessionsFindRelatedResult;
    recordSession(session: Session): void;
    close(): void;
    static shutdown(): void;
    static find(): SessionsDb;
    static createDir(): void;
    static get databaseDir(): string;
    static get databasePath(): string;
}
export interface ISessionsFindRelatedResult {
    relatedSessions: {
        id: string;
        name: string;
    }[];
    relatedScriptInstances: {
        id: string;
        startDate: number;
        defaultSessionId: string;
    }[];
}
export {};
