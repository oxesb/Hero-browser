import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { ConnectionToCore } from '@ulixee/net';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import ITransportToCore from '@ulixee/net/interfaces/ITransportToCore';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import ICoreResponsePayload from '@ulixee/net/interfaces/ICoreResponsePayload';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import CoreCommandQueue from '../lib/CoreCommandQueue';
import CoreSession from '../lib/CoreSession';
export default class ConnectionToHeroCore extends ConnectionToCore<any, {}> {
    readonly commandQueue: CoreCommandQueue;
    options: IConnectionToCoreOptions;
    private coreSessions;
    constructor(transport: ITransportToCore<any, any, ICoreCommandRequestPayload>, options?: Omit<IConnectionToCoreOptions, 'host'>);
    sendRequest(payload: Omit<ICoreCommandRequestPayload, 'messageId' | 'sendTime'>, timeoutMs?: number): Promise<ICoreResponsePayload<any, any>['data']>;
    hasActiveSessions(): boolean;
    createSession(options: ISessionCreateOptions): Promise<CoreSession>;
    getSession(sessionId: string): CoreSession;
    logUnhandledError(error: Error): Promise<void>;
    protected afterConnect(): Promise<void>;
    protected beforeDisconnect(): Promise<void>;
    protected onEvent(payload: ICoreListenerPayload): void;
    static remote(address: string): ConnectionToHeroCore;
    static resolveHost(host: string): string;
}
