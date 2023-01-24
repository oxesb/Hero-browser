import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
import ICommandCounter from '../interfaces/ICommandCounter';
export default class CoreCommandQueue {
    static maxCommandRetries: number;
    mode: ISessionCreateOptions['mode'];
    get lastCommandId(): number;
    get lastCommand(): CoreCommandQueue['internalState']['lastCommand'];
    get commandMetadata(): Record<string, any>;
    get retryingCommand(): CoreCommandQueue['internalState']['retryingCommand'];
    set retryingCommand(commandMeta: CoreCommandQueue['internalState']['retryingCommand']);
    get nextCommandId(): number;
    get shouldRetryCommands(): boolean;
    set shouldRetryCommands(shouldRetry: boolean);
    private readonly internalState;
    private readonly commandCounter?;
    private readonly sessionMarker;
    private readonly meta;
    private readonly connection;
    private flushOnTimeout;
    private flushes;
    private get internalQueue();
    constructor(meta: (ISessionMeta & {
        sessionName: string;
    }) | null, mode: ISessionCreateOptions['mode'], connection: ConnectionToHeroCore, commandCounter: ICommandCounter, internalState?: CoreCommandQueue['internalState']);
    setCommandMetadata(metadata: Record<string, any>): void;
    registerCommandRetryHandlerFn(handlerFn: CoreCommandQueue['internalState']['commandRetryHandlerFns'][0]): void;
    intercept<T>(interceptCommandFn: (meta: ISessionMeta, command: string, ...args: any[]) => any, runCommandsToInterceptFn: () => Promise<T>): Promise<T>;
    record(command: {
        command: string;
        args: any[];
        commandId?: number;
    }): void;
    flush(): Promise<void>;
    runOutOfBand<T>(command: string, ...args: any[]): Promise<T>;
    run<T>(command: string, ...args: any[]): Promise<T>;
    willStop(): void;
    stop(cancelError: CanceledPromiseError): void;
    createSharedQueue(meta: ISessionMeta & {
        sessionName: string;
    }): CoreCommandQueue;
    private sendRequest;
    private tryRetryCommand;
    private shouldRetryCommand;
}