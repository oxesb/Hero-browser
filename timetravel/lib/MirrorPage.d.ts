import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IMouseEventRecord } from '@ulixee/hero-core/models/MouseEventsTable';
import { IScrollRecord } from '@ulixee/hero-core/models/ScrollEventsTable';
import { IDomRecording } from '@ulixee/hero-core/models/DomChangesTable';
import { Tab } from '@ulixee/hero-core';
import Page from '@ulixee/unblocked-agent/lib/Page';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
import MirrorNetwork from './MirrorNetwork';
export default class MirrorPage extends TypedEventEmitter<{
    close: void;
    open: void;
    goto: {
        url: string;
        loaderId: string;
    };
}> {
    network: MirrorNetwork;
    private showChromeInteractions;
    private debugLogging;
    page: Page;
    isReady: Promise<void>;
    get pageId(): string;
    domRecording: IDomRecording;
    private events;
    private sessionId;
    private pendingDomChanges;
    private loadedDocument;
    private paintEventByTimestamp;
    private isLoadedDocumentDirty;
    private subscribeToTab;
    private loadQueue;
    private logger;
    private get useIsolatedContext();
    constructor(network: MirrorNetwork, domRecording: IDomRecording, showChromeInteractions?: boolean, debugLogging?: boolean);
    attachToPage(page: Page, sessionId: string, setReady?: boolean): Promise<void>;
    open(context: BrowserContext, sessionId: string, viewport?: IViewport, onPage?: (page: Page) => Promise<void>): Promise<void>;
    replaceDomRecording(domRecording: IDomRecording): Promise<void>;
    getPaintIndex(timestamp: number): number;
    subscribe(tab: Tab): void;
    load<T = void>(newPaintIndex?: number, overlayLabel?: string, afterLoadedCb?: () => Promise<T>): Promise<T>;
    showInteractions(highlightNodeIds: {
        frameId: number;
        nodeIds: number[];
    }, mouse: IMouseEventRecord, scroll: IScrollRecord): Promise<void>;
    showStatusText(text: string): Promise<void>;
    close(): Promise<void>;
    getNodeOuterHtml(paintIndex: number, nodeId: number, frameElementNodePointerId?: number): Promise<{
        html: string;
        url: string;
    }>;
    outerHTML(): Promise<string>;
    getDomRecordingSince(sinceTimestamp: number): IDomRecording;
    private getFrameWithDomNodeId;
    private getActiveDocument;
    private setDomRecording;
    private processPendingDomChanges;
    private onPageEvents;
    private evaluate;
    private applyFrameNodePath;
    private isLoadedDocument;
    private injectPaintEvents;
}
