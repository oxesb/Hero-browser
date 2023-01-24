import CertificatesTable from '../models/CertificatesTable';
export default class NetworkDb {
    private static hasInitialized;
    readonly certificates: CertificatesTable;
    private db;
    private readonly batchInsert;
    private readonly saveInterval;
    private readonly tables;
    constructor(options?: {
        enableSqliteWAL: boolean;
    });
    close(): void;
    flush(): void;
    static createDir(): void;
    static get databaseDir(): string;
    static get databasePath(): string;
}
