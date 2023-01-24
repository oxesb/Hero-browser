import ResourcesTable from '../models/ResourcesTable';
import DomChangesTable from '../models/DomChangesTable';
import CommandsTable from '../models/CommandsTable';
import WebsocketMessagesTable from '../models/WebsocketMessagesTable';
import FrameNavigationsTable from '../models/FrameNavigationsTable';
import FramesTable from '../models/FramesTable';
import PageLogsTable from '../models/PageLogsTable';
import SessionTable, { ISessionRecord } from '../models/SessionTable';
import MouseEventsTable from '../models/MouseEventsTable';
import FocusEventsTable from '../models/FocusEventsTable';
import ScrollEventsTable from '../models/ScrollEventsTable';
import SessionLogsTable from '../models/SessionLogsTable';
import ScreenshotsTable from '../models/ScreenshotsTable';
import DevtoolsMessagesTable from '../models/DevtoolsMessagesTable';
import TabsTable from '../models/TabsTable';
import ResourceStatesTable from '../models/ResourceStatesTable';
import SocketsTable from '../models/SocketsTable';
import StorageChangesTable from '../models/StorageChangesTable';
import AwaitedEventsTable from '../models/AwaitedEventsTable';
import DetachedElementsTable from '../models/DetachedElementsTable';
import SnippetsTable from '../models/SnippetsTable';
import DetachedResourcesTable from '../models/DetachedResourcesTable';
import OutputTable from '../models/OutputTable';
import FlowHandlersTable from '../models/FlowHandlersTable';
import FlowCommandsTable from '../models/FlowCommandsTable';
import InteractionStepsTable from '../models/InteractionStepsTable';
interface IDbOptions {
    readonly?: boolean;
    fileMustExist?: boolean;
    enableWalMode?: boolean;
}
export default class SessionDb {
    private static byId;
    private static hasInitialized;
    get readonly(): boolean;
    get isOpen(): boolean;
    readonly path: string;
    readonly commands: CommandsTable;
    readonly frames: FramesTable;
    readonly frameNavigations: FrameNavigationsTable;
    readonly sockets: SocketsTable;
    readonly resources: ResourcesTable;
    readonly resourceStates: ResourceStatesTable;
    readonly websocketMessages: WebsocketMessagesTable;
    readonly domChanges: DomChangesTable;
    readonly detachedElements: DetachedElementsTable;
    readonly detachedResources: DetachedResourcesTable;
    readonly snippets: SnippetsTable;
    readonly interactions: InteractionStepsTable;
    readonly flowHandlers: FlowHandlersTable;
    readonly flowCommands: FlowCommandsTable;
    readonly pageLogs: PageLogsTable;
    readonly sessionLogs: SessionLogsTable;
    readonly session: SessionTable;
    readonly mouseEvents: MouseEventsTable;
    readonly focusEvents: FocusEventsTable;
    readonly scrollEvents: ScrollEventsTable;
    readonly storageChanges: StorageChangesTable;
    readonly screenshots: ScreenshotsTable;
    readonly devtoolsMessages: DevtoolsMessagesTable;
    readonly awaitedEvents: AwaitedEventsTable;
    readonly tabs: TabsTable;
    readonly output: OutputTable;
    readonly sessionId: string;
    keepAlive: boolean;
    private readonly batchInsert?;
    private readonly saveInterval;
    private db;
    private readonly tables;
    constructor(sessionId: string, dbOptions?: IDbOptions);
    close(deleteFile?: boolean): Promise<void>;
    flush(): void;
    static getCached(sessionId: string, fileMustExist?: boolean): SessionDb;
    static find(scriptArgs: ISessionFindArgs): ISessionFindResult;
    static createDir(): void;
    static get databaseDir(): string;
}
export interface ISessionFindResult {
    session: ISessionRecord;
}
export interface ISessionFindArgs {
    scriptInstanceId?: string;
    sessionName?: string;
    scriptEntrypoint?: string;
    sessionId?: string;
}
export {};
