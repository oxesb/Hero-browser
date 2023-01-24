/// <reference types="node" />
import { IBlockedResourceType } from '@ulixee/hero-interfaces/ITabOptions';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IScreenshotOptions from '@ulixee/unblocked-specification/agent/browser/IScreenshotOptions';
import { IJsPath } from '@ulixee/js-path';
import { IInteractionGroups } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import IExecJsPathResult from '@ulixee/unblocked-specification/agent/browser/IExecJsPathResult';
import { ILoadStatus, ILocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import IDialog from '@ulixee/unblocked-specification/agent/browser/IDialog';
import IFileChooserPrompt from '@ulixee/unblocked-specification/agent/browser/IFileChooserPrompt';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import INavigation from '@ulixee/unblocked-specification/agent/browser/INavigation';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import IDomStateListenArgs from '@ulixee/hero-interfaces/IDomStateListenArgs';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import MirrorPage from '@ulixee/hero-timetravel/lib/MirrorPage';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import FrameNavigations from '@ulixee/unblocked-agent/lib/FrameNavigations';
import FrameNavigationsObserver from '@ulixee/unblocked-agent/lib/FrameNavigationsObserver';
import Page from '@ulixee/unblocked-agent/lib/Page';
import { IWebsocketMessage } from '@ulixee/unblocked-agent/lib/WebsocketMessages';
import FrameEnvironment from './FrameEnvironment';
import Session from './Session';
import { IDomChangeRecord } from '../models/DomChangesTable';
import { ICommandableTarget } from './CommandRunner';
import DomStateListener from './DomStateListener';
import { IStorageChangesEntry } from '../models/StorageChangesTable';
import { IRemoteEmitFn, IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import { IMouseEventRecord } from '../models/MouseEventsTable';
import { IScrollRecord } from '../models/ScrollEventsTable';
import { IFocusRecord } from '../models/FocusEventsTable';
export default class Tab extends TypedEventEmitter<ITabEventParams> implements ISessionMeta, ICommandableTarget, IRemoteEventListener {
    get id(): number;
    readonly parentTabId?: number;
    session: Session;
    readonly frameEnvironmentsById: Map<number, FrameEnvironment>;
    readonly frameEnvironmentsByDevtoolsId: Map<string, FrameEnvironment>;
    page: Page;
    isClosing: boolean;
    isReady: Promise<void>;
    readonly mirrorPage: MirrorPage;
    protected readonly logger: IBoundLog;
    private readonly mirrorNetwork;
    private detachedElementsPendingHTML;
    private events;
    private commandRecorder;
    private readonly createdAtCommandId;
    private waitTimeouts;
    private lastFileChooserEvent;
    private readonly domStateListenersByJsPathId;
    get navigations(): FrameNavigations;
    get navigationsObserver(): FrameNavigationsObserver;
    get url(): string;
    get lastCommandId(): number | undefined;
    get tabId(): number;
    get sessionId(): string;
    get mainFrameId(): number;
    get mainFrameEnvironment(): FrameEnvironment;
    private constructor();
    createMirrorPage(): MirrorPage;
    getFrameEnvironment(frameId?: number): FrameEnvironment;
    isAllowedCommand(method: string): boolean;
    setBlockedResourceTypes(blockedResourceTypes: IBlockedResourceType[]): Promise<void>;
    setBlockedResourceUrls(blockedUrls: (string | RegExp)[]): void;
    close(): Promise<void>;
    setOrigin(origin: string): Promise<void>;
    detachResource(name: string, resourceId: number, timestamp: number): Promise<void>;
    getResourceProperty(resourceId: number, propertyPath: 'response.buffer' | 'messages' | 'request.postData'): Promise<Buffer | IWebsocketMessage[]>;
    findResource(filter: IResourceFilterProperties, options?: {
        sinceCommandId: number;
    }): Promise<IResourceMeta>;
    findResources(filter: IResourceFilterProperties, options?: {
        sinceCommandId: number;
    }): Promise<IResourceMeta[]>;
    findStorageChange(filter: Omit<IStorageChangesEntry, 'tabId' | 'timestamp' | 'value' | 'meta'>): IStorageChangesEntry;
    interact(...interactionGroups: IInteractionGroups): Promise<void>;
    isPaintingStable(): Promise<boolean>;
    isDomContentLoaded(): Promise<boolean>;
    isAllContentLoaded(): Promise<boolean>;
    getJsValue<T>(path: string): Promise<{
        value: T;
        type: string;
    }>;
    execJsPath<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>>;
    getUrl(): Promise<string>;
    waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<INavigation>;
    waitForLocation(trigger: ILocationTrigger, options?: IWaitForOptions): Promise<IResourceMeta>;
    getFrameEnvironments(): Promise<IFrameMeta[]>;
    goto(url: string, options?: {
        timeoutMs?: number;
    }): Promise<IResourceMeta>;
    goBack(options?: {
        timeoutMs?: number;
    }): Promise<string>;
    goForward(options?: {
        timeoutMs?: number;
    }): Promise<string>;
    reload(options?: {
        timeoutMs?: number;
    }): Promise<IResourceMeta>;
    focus(): Promise<void>;
    pendingCollects(): Promise<any>;
    onResource(x: ITabEventParams['resource']): void;
    onElementRequested(detachedElement: IDetachedElement, saveToDb?: boolean): Promise<IDetachedElement>;
    getElementHtml(detachedElement: IDetachedElement): Promise<IDetachedElement>;
    takeScreenshot(options?: IScreenshotOptions): Promise<Buffer>;
    dismissDialog(accept: boolean, promptText?: string): Promise<void>;
    waitForNewTab(options?: IWaitForOptions): Promise<Tab>;
    waitForResources(filter: IResourceFilterProperties, options?: IWaitForResourceOptions): Promise<IResourceMeta[]>;
    waitForFileChooser(options?: IWaitForOptions): Promise<IFileChooserPrompt>;
    waitForMillis(millis: number): Promise<void>;
    runPluginCommand(toPluginId: string, args: any[]): Promise<any>;
    willRunCommand(command: ICommandMeta): void;
    addDomStateListener(id: string, options: IDomStateListenArgs): DomStateListener;
    flushDomChanges(): Promise<void>;
    getDomChanges(frameId?: number, sinceCommandId?: number): Promise<IDomChangeRecord[]>;
    registerFlowHandler(name: string, id: number, callsitePath: ISourceCodeLocation): Promise<void>;
    registerFlowCommand(id: number, parentId: number, callsitePath: ISourceCodeLocation): Promise<void>;
    assert(batchId: string, domStateIdJsPath: IJsPath): Promise<boolean>;
    addRemoteEventListener(type: 'message' | 'dom-state' | keyof Tab['EventTypes'], emitFn: IRemoteEmitFn, jsPath?: IJsPath, options?: any): Promise<{
        listenerId: string;
    }>;
    removeRemoteEventListener(listenerId: string, options?: any): Promise<any>;
    toJSON(): ISessionMeta;
    private waitForReady;
    private listen;
    private onPageCallback;
    private isResourceFilterMatch;
    private onResourceWillBeRequested;
    private onScreenshot;
    private onStorageUpdated;
    private onFrameCreated;
    private onPageError;
    private onConsole;
    private onTargetCrashed;
    private translateDevtoolsFrameId;
    private onDialogOpening;
    private onFileChooser;
    static create(session: Session, page: Page, parentTabId?: number, openParams?: {
        url: string;
        windowName: string;
    }): Tab;
}
export interface ITabEventParams {
    'child-tab-created': Tab;
    close: null;
    dialog: IDialog;
    'page-events': {
        frame: FrameEnvironment;
        records: {
            domChanges: IDomChangeRecord[];
            focusEvents: IFocusRecord[];
            mouseEvents: IMouseEventRecord[];
            scrollEvents: IScrollRecord[];
        };
    };
    'wait-for-domstate': {
        listener: DomStateListener;
    };
    'resource-requested': IResourceMeta;
    resource: IResourceMeta;
    'websocket-message': IWebsocketMessage;
}
export declare function stringToRegex(str: string): RegExp;
