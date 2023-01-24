import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import ITransportToClient from '@ulixee/net/interfaces/ITransportToClient';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import IConnectionToClient, { IConnectionToClientEvents } from '@ulixee/net/interfaces/IConnectionToClient';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { ICommandableTarget } from '../lib/CommandRunner';
export default class ConnectionToHeroClient extends TypedEventEmitter<IConnectionToClientEvents> implements IConnectionToClient<any, {}>, ICommandableTarget {
    readonly transport: ITransportToClient<any>;
    autoShutdownMillis: number;
    disconnectPromise: Promise<void>;
    private autoShutdownTimer;
    private readonly sessionIdToRemoteEvents;
    private activeCommandMessageIds;
    constructor(transport: ITransportToClient<any>, autoShutdownMillis?: number);
    handleRequest(payload: ICoreCommandRequestPayload): Promise<void>;
    connect(options?: ICoreConfigureOptions & {
        version?: string;
    }): Promise<{
        maxConcurrency: number;
    }>;
    logUnhandledError(error: Error, fatalError?: boolean): void;
    disconnect(fatalError?: Error): Promise<void>;
    isActive(): boolean;
    isAllowedCommand(method: string): boolean;
    sendEvent(message: ICoreListenerPayload): void;
    createSession(options?: ISessionCreateOptions): Promise<ISessionMeta>;
    private recordCommands;
    private executeCommand;
    private disconnectIfInactive;
    private checkForAutoShutdown;
    private isLaunchError;
    private serializeToMetadata;
    private serializeError;
}
