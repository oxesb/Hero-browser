import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class CommandsTable extends SqliteTable<ICommandMeta> {
    constructor(db: SqliteDatabase);
    insert(commandMeta: ICommandMeta): void;
}
