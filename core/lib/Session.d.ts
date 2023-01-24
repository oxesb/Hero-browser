import RequestSession from '@ulixee/unblocked-agent-mitm/handlers/RequestSession';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import IDataSnippet from '@ulixee/hero-interfaces/IDataSnippet';
import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';
import Agent from '@ulixee/unblocked-agent/lib/Agent';
import Resources from '@ulixee/unblocked-agent/lib/Resources';
import WebsocketMessages from '@ulixee/unblocked-agent/lib/WebsocketMessages';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
import Tab from './Tab';
import CorePlugins from './CorePlugins';
import SessionDb from '../dbs/SessionDb';
import { ICommandableTarget } from './CommandRunner';
import Commands from './Commands';
import { IRemoteEmitFn, IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import { IOutputChangeRecord } from '../models/OutputTable';
export default class Session extends TypedEventEmitter<{
    closing: void;
    closed: {
        waitForPromise?: Promise<any>;
    };
    resumed: void;
    'will-close': {
        waitForPromise?: Promise<any>;
    };
    'kept-alive': {
        message: string;
    };
    'tab-created': {
        tab: Tab;
    };
    'all-tabs-closed': void;
    output: {
        changes: IOutputChangeRecord[];
    };
    'collected-asset': {
        type: 'resource' | 'snippet' | 'element';
        asset: IDataSnippet | IDetachedElement | IDetachedResource;
    };
}> implements ICommandableTarget, IRemoteEventListener {
    readonly options: ISessionCreateOptions;
    static events: TypedEventEmitter<{
        new: {
            session: Session;
        };
        closed: {
            id: string;
            databasePath: string;
        };
    }>;
    private static readonly byId;
    readonly id: string;
    readonly baseDir: string;
    plugins: CorePlugins;
    get browserEngine(): IBrowserEngine;
    get userProfile(): IUserProfile;
    get mode(): ISessionCreateOptions['mode'];
    get viewport(): IViewport;
    readonly createdTime: number;
    bypassResourceRegistrationForHost: URL;
    get mitmRequestSession(): RequestSession;
    browserContext?: BrowserContext;
    commands: Commands;
    db: SessionDb;
    get resources(): Resources;
    get websocketMessages(): WebsocketMessages;
    tabsById: Map<number, Tab>;
    get isClosing(): boolean;
    get emulationProfile(): IEmulationProfile;
    get meta(): IHeroMeta;
    awaitedEventEmitter: TypedEventEmitter<{
        close: void;
        'rerun-stderr': string;
        'rerun-stdout': string;
        'rerun-kept-alive': void;
    }>;
    agent: Agent;
    protected readonly logger: IBoundLog;
    private hasLoadedUserProfile;
    private commandRecorder;
    private _isClosing;
    private isResettingState;
    private readonly logSubscriptionId;
    private events;
    protected constructor(options: ISessionCreateOptions);
    getSummary(): ISessionSummary;
    isAllowedCommand(method: string): boolean;
    shouldWaitForCommandLock(method: keyof Session): boolean;
    getTab(id: number): Tab;
    getTabs(): Promise<Tab[]>;
    flush(): Promise<void>;
    getHeroMeta(): Promise<IHeroMeta>;
    setSnippet(key: string, value: any, timestamp: number): Promise<void>;
    getCollectedAssetNames(fromSessionId: string): Promise<{
        resources: string[];
        elements: string[];
        snippets: string[];
    }>;
    getSnippets(fromSessionId: string, name: string): Promise<IDataSnippet[]>;
    getDetachedResources(fromSessionId: string, name: string): Promise<IDetachedResource[]>;
    getDetachedElements(fromSessionId: string, name: string): Promise<IDetachedElement[]>;
    openBrowser(): Promise<void>;
    exportUserProfile(): Promise<IUserProfile>;
    createTab(): Promise<Tab>;
    getLastActiveTab(): Tab;
    resetStorage(): Promise<void>;
    closeTabs(): Promise<void>;
    close(force?: boolean): Promise<{
        didKeepAlive: boolean;
        message?: string;
    }>;
    addRemoteEventListener(type: keyof Session['awaitedEventEmitter']['EventTypes'], emitFn: IRemoteEmitFn): Promise<{
        listenerId: string;
    }>;
    removeRemoteEventListener(listenerId: string): Promise<any>;
    recordOutput(...changes: IOutputChangeRecord[]): Promise<void>;
    pauseCommands(): Promise<void>;
    resumeCommands(): Promise<void>;
    private willClose;
    private keepAlive;
    private resume;
    private getId;
    private cleanup;
    private onResource;
    private onWebsocketMessage;
    private onCookieChange;
    private onResourceNeedsMerge;
    private onBrowserLoadedResource;
    private onBrowserRequestedResource;
    private onDevtoolsMessage;
    private onResourceStates;
    private onSocketClose;
    private onSocketConnect;
    private onNewTab;
    private registerTab;
    private recordLog;
    private recordTab;
    private recordSession;
    static restoreOptionsFromSessionRecord(options: ISessionCreateOptions, resumeSessionId: string): ISessionCreateOptions;
    static create(options: ISessionCreateOptions): Promise<{
        session: Session;
        tab: Tab;
        isSessionResume: boolean;
    }>;
    static get(sessionId: string): Session;
    static getTab(meta: ISessionMeta): Tab | undefined;
    static hasKeepAliveSessions(): boolean;
    static sessionsWithBrowserId(browserId: string): Session[];
}
