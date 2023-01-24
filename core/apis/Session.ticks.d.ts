import { IDocument, IPaintEvent } from '../models/DomChangesTable';
import { IMouseEventRecord } from '../models/MouseEventsTable';
import { IFocusRecord } from '../models/FocusEventsTable';
import { IScrollRecord } from '../models/ScrollEventsTable';
import ICommandWithResult from '../interfaces/ICommandWithResult';
import { ISessionTab } from './Session.tabs';
export default function sessionTicksApi(args: ISessionTicksArgs): ISessionTicksResult;
interface ISessionTicksArgs {
    sessionId: string;
    timelineRange?: [startTime: number, endTime?: number];
    includeInteractionEvents?: boolean;
    includeCommands?: boolean;
    includePaintEvents?: boolean;
}
interface ISessionTicksResult {
    tabDetails: ITabDetails[];
}
export interface ITabDetails {
    tab: ISessionTab;
    ticks: ITick[];
    mouse?: IMouseEventRecord[];
    focus?: IFocusRecord[];
    scroll?: IScrollRecord[];
    commands?: ICommandWithResult[];
    paintEvents?: IPaintEvent[];
    detachedPaintEvents?: {
        sourceTabId: number;
        url: string;
        frameNavigationId: number;
        indexRange: [number, number];
        timestampRange: [number, number];
    };
    documents: IDocument[];
}
export interface ITick {
    eventType: 'command' | 'paint' | 'focus' | 'mouse' | 'scroll' | 'init';
    eventTypeIndex: number;
    commandId: number;
    timestamp: number;
    timelineOffsetPercent: number;
    isMajor: boolean;
    label?: string;
    isNewDocumentTick: boolean;
    documentUrl: string;
    documentLoadPaintIndex: number;
    highlightNodeIds?: {
        frameId: number;
        nodeIds: number[];
    };
    paintEventIndex?: number;
    scrollEventIndex?: number;
    focusEventIndex?: number;
    mouseEventIndex?: number;
}
export {};
