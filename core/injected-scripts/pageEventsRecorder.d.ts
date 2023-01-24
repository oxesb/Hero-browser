import type { IDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';
import type { IMouseEvent } from '@ulixee/hero-interfaces/IMouseEvent';
import type { IFocusEvent } from '@ulixee/hero-interfaces/IFocusEvent';
import type { IScrollEvent } from '@ulixee/hero-interfaces/IScrollEvent';
import type { ILoadEvent } from '@ulixee/hero-interfaces/ILoadEvent';
declare global {
    interface Window {
        extractDomChanges(): PageRecorderResultSet;
        flushPageRecorder(): PageRecorderResultSet;
        checkForShadowRoot(path: {
            localName: string;
            id: string;
            index: number;
            hasShadowHost: boolean;
        }[]): void;
        listenToInteractionEvents(): void;
        trackElement(element: Element): void;
        doNotTrackElement(element: Element): void;
        PaintEvents: {
            onEventCallbackFn: (paintEvent: 'DOMContentLoaded' | 'AllContentLoaded' | 'LargestContentfulPaint' | 'FirstContentfulPaint', timestamp: number) => void;
        };
    }
}
export declare type PageRecorderResultSet = [
    IDomChangeEvent[],
    IMouseEvent[],
    IFocusEvent[],
    IScrollEvent[],
    ILoadEvent[]
];
