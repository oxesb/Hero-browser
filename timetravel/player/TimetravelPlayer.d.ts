import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { ITick } from '@ulixee/hero-core/apis/Session.ticks';
import ConnectionToHeroApiCore from '@ulixee/hero-core/connections/ConnectionToHeroApiCore';
import ITimelineMetadata from '@ulixee/hero-interfaces/ITimelineMetadata';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
import TabPlaybackController from './TabPlaybackController';
export default class TimetravelPlayer extends TypedEventEmitter<{
    'new-tick-command': {
        commandId: number;
        paintIndex: number;
    };
    'new-paint-index': {
        tabId: number;
        paintIndexRange: [start: number, end: number];
        documentLoadPaintIndex: number;
    };
    'new-offset': {
        tabId: number;
        percentOffset: number;
        focusedRange: [start: number, end: number];
    };
    'tab-opened': void;
    'all-tabs-closed': void;
}> {
    readonly sessionId: string;
    readonly connection: ConnectionToHeroApiCore;
    readonly loadIntoContext: {
        browserContext?: BrowserContext;
        plugins?: CorePlugins;
    };
    private timelineRange?;
    readonly debugLogging: boolean;
    get activeCommandId(): number;
    activeTabId: number;
    get activeTab(): TabPlaybackController;
    get isOpen(): boolean;
    private mirrorNetwork;
    private tabsById;
    private readonly sessionOptions;
    private isReady;
    private constructor();
    isOwnPage(pageId: string): boolean;
    findCommandPercentOffset(commandId: number): Promise<number>;
    loadTick(tick: ITick): Promise<void>;
    step(direction: 'forward' | 'back'): Promise<number>;
    setFocusedOffsetRange(offsetRange: [start: number, end: number]): Promise<void>;
    goto(sessionOffsetPercent: number, statusMetadata?: ITimelineMetadata): Promise<TabPlaybackController>;
    showLoadStatus(metadata: ITimelineMetadata): Promise<void>;
    showStatusText(text: string): Promise<void>;
    close(): Promise<void>;
    activateTab(tabPlaybackController: TabPlaybackController): void;
    refreshTicks(timelineOffsetRange: [startTime: number, endTime?: number]): Promise<void>;
    private openTab;
    private activePlugins;
    private checkAllPagesClosed;
    private load;
    private onTabOpen;
    private getResourceDetails;
    static create(heroSessionId: string, loadIntoContext: {
        browserContext?: BrowserContext;
        plugins?: CorePlugins;
    }, timelineRange?: [startTime: number, endTime: number], connectionToCoreApi?: ConnectionToHeroApiCore): TimetravelPlayer;
}
