"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const MirrorPage_1 = require("../lib/MirrorPage");
class TabPlaybackController {
    constructor(tabDetails, mirrorNetwork, sessionId, debugLogging = false) {
        this.tabDetails = tabDetails;
        this.mirrorNetwork = mirrorNetwork;
        this.sessionId = sessionId;
        this.currentTimelineOffsetPct = 0;
        this.isPlaying = false;
        this.currentTickIndex = -1;
        this.events = new EventSubscriber_1.default();
        // put in placeholder
        this.paintEventsLoadedIdx = -1;
        const domRecording = TabPlaybackController.tabDetailsToDomRecording(tabDetails);
        this.mirrorPage = new MirrorPage_1.default(this.mirrorNetwork, domRecording, true, debugLogging);
    }
    get id() {
        return this.tabDetails.tab.id;
    }
    get ticks() {
        return this.tabDetails.ticks;
    }
    get currentTick() {
        return this.ticks[this.currentTickIndex];
    }
    get nextTick() {
        return this.ticks[this.currentTickIndex + 1];
    }
    get previousTick() {
        return this.ticks[this.currentTickIndex - 1];
    }
    get nextTimelineOffsetPercent() {
        const currentOffset = this.currentTick?.timelineOffsetPercent || 0;
        let tick;
        for (let i = this.currentTickIndex; i < this.ticks.length; i += 1) {
            tick = this.ticks[i];
            if (tick && tick.timelineOffsetPercent > currentOffset) {
                return tick.timelineOffsetPercent;
            }
        }
        return 100;
    }
    get previousTimelineOffsetPercent() {
        const currentOffset = this.currentTick?.timelineOffsetPercent || 0;
        let tick;
        for (let i = this.currentTickIndex; i >= 0; i -= 1) {
            tick = this.ticks[i];
            if (tick && tick.timelineOffsetPercent < currentOffset) {
                return tick.timelineOffsetPercent;
            }
        }
        return 0;
    }
    get isOpen() {
        return !!this.mirrorPage?.pageId;
    }
    get focusedPaintIndexes() {
        if (!this.focusedTickRange) {
            return [this.currentTick?.paintEventIndex, this.currentTick?.paintEventIndex];
        }
        const [start, end] = this.focusedTickRange;
        const startTick = this.ticks[start];
        const endTick = this.ticks[end];
        return [startTick?.paintEventIndex ?? -1, endTick?.paintEventIndex ?? -1];
    }
    updateTabDetails(tabDetails) {
        Object.assign(this.tabDetails, tabDetails);
        if (this.currentTickIndex >= 0) {
            this.currentTimelineOffsetPct =
                this.tabDetails.ticks[this.currentTickIndex]?.timelineOffsetPercent;
        }
        const domRecording = TabPlaybackController.tabDetailsToDomRecording(tabDetails);
        return this.mirrorPage.replaceDomRecording(domRecording);
    }
    isPage(id) {
        return this.mirrorPage?.pageId === id;
    }
    async open(browserContext, onPage) {
        await this.mirrorPage.open(browserContext, this.sessionId, null, onPage);
        if (this.mirrorPage.page.mainFrame.url === 'about:blank') {
            await this.mirrorPage.page.navigate(this.tabDetails.documents[0].url);
        }
        this.events.once(this.mirrorPage, 'close', () => {
            this.paintEventsLoadedIdx = -1;
            this.isPlaying = false;
            this.currentTickIndex = -1;
            this.currentTimelineOffsetPct = 0;
        });
    }
    async play(onTick) {
        let pendingMillisDeficit = 0;
        this.isPlaying = true;
        for (let i = this.currentTickIndex; i < this.ticks.length; i += 1) {
            if (!this.isPlaying)
                break;
            if (i < 0)
                continue;
            const startTime = Date.now();
            await this.loadTick(i);
            onTick(this.ticks[i]);
            const fnDuration = Date.now() - startTime;
            if (i < this.ticks.length - 1) {
                const currentTick = this.ticks[i];
                const nextTick = this.ticks[i + 1];
                const diff = nextTick.timestamp - currentTick.timestamp;
                const delay = diff - fnDuration - pendingMillisDeficit;
                if (delay > 0)
                    await new Promise(resolve => setTimeout(resolve, delay));
                else if (delay < 0)
                    pendingMillisDeficit = Math.abs(delay);
            }
        }
    }
    pause() {
        this.isPlaying = false;
    }
    async close() {
        // go ahead and say this is closed
        this.mirrorPage.emit('close');
        await this.mirrorPage.close();
        this.events.close();
    }
    setFocusedOffsetRange(offsetRange) {
        if (!offsetRange) {
            this.focusedTickRange = null;
            this.focusedOffsetRange = null;
            return;
        }
        const [startPercent, endPercent] = offsetRange;
        this.focusedOffsetRange = offsetRange;
        this.focusedTickRange = [-1, -1];
        for (let i = 0; i < this.ticks.length; i += 1) {
            const offset = this.ticks[i].timelineOffsetPercent;
            if (offset < startPercent)
                continue;
            if (offset > endPercent)
                break;
            if (this.focusedTickRange[0] === -1) {
                this.focusedTickRange[0] = i;
            }
            this.focusedTickRange[1] = i;
        }
        if (this.focusedTickRange[1] === -1)
            this.focusedTickRange[1] = this.currentTickIndex;
    }
    findClosestTickIndex(timelineOffset) {
        const ticks = this.ticks;
        if (!ticks.length || this.currentTimelineOffsetPct === timelineOffset)
            return this.currentTickIndex;
        let newTickIdx = this.currentTickIndex;
        // if going forward, load next ticks
        if (timelineOffset > this.currentTimelineOffsetPct) {
            for (let i = newTickIdx; i < ticks.length; i += 1) {
                if (i < 0)
                    continue;
                if (ticks[i].timelineOffsetPercent > timelineOffset)
                    break;
                newTickIdx = i;
            }
        }
        else {
            for (let i = newTickIdx; i >= 0; i -= 1) {
                newTickIdx = i;
                if (ticks[i].timelineOffsetPercent <= timelineOffset)
                    break;
            }
        }
        return newTickIdx;
    }
    async setTimelineOffset(timelineOffset) {
        const newTickIdx = this.findClosestTickIndex(timelineOffset);
        if (this.currentTickIndex === newTickIdx)
            return;
        await this.loadTick(newTickIdx, timelineOffset);
    }
    async loadEndState() {
        await this.loadTick(this.ticks.length - 1);
    }
    async loadTick(newTickOrIdx, specificTimelineOffset) {
        if (newTickOrIdx === this.currentTickIndex || newTickOrIdx === this.currentTick) {
            return;
        }
        const mirrorPage = this.mirrorPage;
        let newTick = newTickOrIdx;
        let newTickIdx = newTickOrIdx;
        if (typeof newTickOrIdx === 'number') {
            newTick = this.ticks[newTickOrIdx];
        }
        else {
            newTickIdx = this.ticks.indexOf(newTickOrIdx);
        }
        this.currentTickIndex = newTickIdx;
        this.currentTimelineOffsetPct = specificTimelineOffset ?? newTick.timelineOffsetPercent;
        const newPaintIndex = newTick.paintEventIndex;
        if (newPaintIndex !== this.paintEventsLoadedIdx) {
            this.paintEventsLoadedIdx = newPaintIndex;
            await mirrorPage.load(newPaintIndex);
        }
        const mouseEvent = this.tabDetails.mouse[newTick.mouseEventIndex];
        const scrollEvent = this.tabDetails.scroll[newTick.scrollEventIndex];
        const nodesToHighlight = newTick.highlightNodeIds;
        if (nodesToHighlight || mouseEvent || scrollEvent) {
            await mirrorPage.showInteractions(nodesToHighlight, mouseEvent, scrollEvent);
        }
    }
    async showStatusText(text) {
        await this.mirrorPage.showStatusText(text);
    }
    getPaintEventAtIndex(index) {
        return this.tabDetails.paintEvents[index];
    }
    static tabDetailsToDomRecording(tabDetails) {
        const mainFrameIds = new Set();
        const domNodePathByFrameId = {};
        for (const frame of tabDetails.tab.frames) {
            if (frame.isMainFrame)
                mainFrameIds.add(frame.id);
            domNodePathByFrameId[frame.id] = frame.domNodePath;
        }
        return {
            paintEvents: tabDetails.paintEvents,
            documents: tabDetails.documents,
            domNodePathByFrameId,
            mainFrameIds,
        };
    }
}
exports.default = TabPlaybackController;
//# sourceMappingURL=TabPlaybackController.js.map