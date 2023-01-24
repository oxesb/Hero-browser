"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const hero_core_1 = require("@ulixee/hero-core");
const ConnectionToHeroApiClient_1 = require("@ulixee/hero-core/connections/ConnectionToHeroApiClient");
const ConnectionToHeroApiCore_1 = require("@ulixee/hero-core/connections/ConnectionToHeroApiCore");
const MirrorNetwork_1 = require("../lib/MirrorNetwork");
const TabPlaybackController_1 = require("./TabPlaybackController");
const { log } = (0, Logger_1.default)(module);
class TimetravelPlayer extends eventUtils_1.TypedEventEmitter {
    constructor(sessionId, connection, loadIntoContext, timelineRange, debugLogging = false) {
        super();
        this.sessionId = sessionId;
        this.connection = connection;
        this.loadIntoContext = loadIntoContext;
        this.timelineRange = timelineRange;
        this.debugLogging = debugLogging;
        this.mirrorNetwork = new MirrorNetwork_1.default({
            ignoreJavascriptRequests: true,
            headersFilter: ['set-cookie'],
            loadResourceDetails: this.getResourceDetails.bind(this),
        });
        this.tabsById = new Map();
        this.sessionOptions = {
            ...hero_core_1.Session.get(sessionId)?.options ?? hero_core_1.Session.restoreOptionsFromSessionRecord({}, sessionId),
        };
        this.sessionOptions.mode = 'timetravel';
    }
    get activeCommandId() {
        if (this.isOpen) {
            return this.activeTab?.currentTick?.commandId;
        }
    }
    get activeTab() {
        return this.tabsById.get(this.activeTabId);
    }
    get isOpen() {
        for (const tab of this.tabsById.values()) {
            if (tab.isOpen)
                return true;
        }
        return false;
    }
    isOwnPage(pageId) {
        for (const tab of this.tabsById.values()) {
            if (tab.isPage(pageId))
                return true;
        }
        return false;
    }
    async findCommandPercentOffset(commandId) {
        this.isReady ?? (this.isReady = this.load());
        await this.isReady;
        for (const tick of this.activeTab.ticks) {
            if (tick.commandId === commandId)
                return tick.timelineOffsetPercent;
        }
        return 0;
    }
    async loadTick(tick) {
        await this.isReady;
        const tab = this.activeTab;
        await this.openTab(tab);
        await tab.loadTick(tick);
    }
    async step(direction) {
        this.isReady ?? (this.isReady = this.load());
        await this.isReady;
        let percentOffset;
        if (!this.isOpen) {
            percentOffset = this.activeTab.ticks[this.activeTab.ticks.length - 1]?.timelineOffsetPercent;
        }
        else if (direction === 'forward') {
            percentOffset = this.activeTab.nextTimelineOffsetPercent;
        }
        else {
            percentOffset = this.activeTab.previousTimelineOffsetPercent;
        }
        await this.goto(percentOffset);
        return percentOffset;
    }
    async setFocusedOffsetRange(offsetRange) {
        this.isReady ?? (this.isReady = this.load());
        await this.isReady;
        this.activeTab.setFocusedOffsetRange(offsetRange);
    }
    async goto(sessionOffsetPercent, statusMetadata) {
        this.isReady ?? (this.isReady = this.load());
        await this.isReady;
        /**
         * TODO: eventually this playbar needs to know which tab is active in the timeline at this offset
         *       If 1 tab is active, switch to it, otherwise, need to show the multi-timeline view and pick one tab to show
         */
        const tab = this.activeTab;
        const startTick = tab.currentTick;
        const startOffset = tab.currentTimelineOffsetPct;
        await this.openTab(tab);
        if (sessionOffsetPercent !== undefined) {
            await tab.setTimelineOffset(sessionOffsetPercent);
        }
        else {
            await tab.loadEndState();
        }
        if (tab.currentTick && tab.currentTick.commandId !== startTick?.commandId) {
            this.emit('new-tick-command', {
                commandId: tab.currentTick.commandId,
                paintIndex: tab.currentTick.paintEventIndex,
            });
        }
        if (tab.currentTick && tab.currentTick.paintEventIndex !== startTick?.paintEventIndex) {
            this.emit('new-paint-index', {
                paintIndexRange: tab.focusedPaintIndexes,
                tabId: tab.id,
                documentLoadPaintIndex: tab.currentTick.documentLoadPaintIndex,
            });
        }
        if (tab.currentTimelineOffsetPct !== startOffset) {
            this.emit('new-offset', {
                tabId: tab.id,
                percentOffset: tab.currentTimelineOffsetPct,
                focusedRange: tab.focusedOffsetRange,
            });
        }
        if (statusMetadata)
            await this.showLoadStatus(statusMetadata);
        return tab;
    }
    async showLoadStatus(metadata) {
        if (!this.activeTab)
            return;
        const timelineOffsetPercent = this.activeTab.currentTimelineOffsetPct;
        if (!metadata || timelineOffsetPercent === 100)
            return;
        let currentUrl;
        let activeStatus;
        for (const url of metadata.urls) {
            if (url.offsetPercent > timelineOffsetPercent)
                break;
            currentUrl = url;
        }
        for (const status of currentUrl?.loadStatusOffsets ?? []) {
            if (status.offsetPercent > timelineOffsetPercent)
                break;
            activeStatus = status;
        }
        if (activeStatus) {
            await this.showStatusText(activeStatus.status);
        }
    }
    async showStatusText(text) {
        if (this.isReady === null)
            return;
        await this.isReady;
        const tab = this.activeTab;
        if (!tab)
            return;
        await this.openTab(tab);
        await tab.showStatusText(text);
    }
    async close() {
        this.isReady = null;
        for (const tab of this.tabsById.values()) {
            await tab.close();
        }
        this.activeTabId = null;
        this.tabsById.clear();
    }
    activateTab(tabPlaybackController) {
        this.activeTabId = tabPlaybackController.id;
        if (!this.tabsById.has(tabPlaybackController.id)) {
            this.tabsById.set(tabPlaybackController.id, tabPlaybackController);
        }
    }
    async refreshTicks(timelineOffsetRange) {
        if (this.timelineRange && this.timelineRange.toString() === timelineOffsetRange.toString())
            return;
        if (timelineOffsetRange) {
            this.timelineRange = [...timelineOffsetRange];
        }
        await this.load();
    }
    async openTab(tab) {
        if (tab.isOpen)
            return;
        await tab.open(this.loadIntoContext.browserContext, this.activePlugins.bind(this));
    }
    async activePlugins(page) {
        if (!this.loadIntoContext.plugins)
            return;
        await Promise.all(this.loadIntoContext.plugins.instances.filter(x => x.onNewPage).map(x => x.onNewPage(page)));
    }
    async checkAllPagesClosed() {
        await new Promise(setImmediate);
        for (const tab of this.tabsById.values()) {
            if (tab.isOpen)
                return;
        }
        this.emit('all-tabs-closed');
    }
    async load() {
        const ticksResult = await this.connection.sendRequest({
            command: 'Session.ticks',
            args: [
                {
                    sessionId: this.sessionId,
                    includeCommands: true,
                    includeInteractionEvents: true,
                    includePaintEvents: true,
                    timelineRange: this.timelineRange,
                },
            ],
        });
        if (this.debugLogging) {
            log.info('Timetravel Tab State', {
                sessionId: this.sessionId,
                tabDetails: ticksResult.tabDetails,
            });
        }
        for (const tabDetails of ticksResult.tabDetails) {
            const tabPlaybackController = this.tabsById.get(tabDetails.tab.id);
            if (tabPlaybackController) {
                await tabPlaybackController.updateTabDetails(tabDetails);
                continue;
            }
            const tab = new TabPlaybackController_1.default(tabDetails, this.mirrorNetwork, this.sessionId, this.debugLogging);
            tab.mirrorPage.on('open', this.onTabOpen.bind(this));
            tab.mirrorPage.on('close', this.checkAllPagesClosed.bind(this));
            this.tabsById.set(tabDetails.tab.id, tab);
            this.activeTabId ?? (this.activeTabId = tabDetails.tab.id);
        }
        const resourcesResult = await this.connection.sendRequest({
            command: 'Session.resources',
            args: [{ sessionId: this.sessionId, omitWithoutResponse: true, omitNonHttpGet: true }],
        });
        this.mirrorNetwork.setResources(resourcesResult.resources, this.getResourceDetails.bind(this));
    }
    onTabOpen() {
        this.emit('tab-opened');
    }
    async getResourceDetails(resourceId) {
        const { resource } = await this.connection.sendRequest({
            command: 'Session.resource',
            args: [
                {
                    sessionId: this.sessionId,
                    resourceId,
                },
            ],
        });
        return resource;
    }
    static create(heroSessionId, loadIntoContext, timelineRange, connectionToCoreApi) {
        if (!connectionToCoreApi) {
            const bridge = ConnectionToHeroApiClient_1.default.createBridge();
            connectionToCoreApi = new ConnectionToHeroApiCore_1.default(bridge.transportToCore);
        }
        return new TimetravelPlayer(heroSessionId, connectionToCoreApi, loadIntoContext, timelineRange);
    }
}
exports.default = TimetravelPlayer;
//# sourceMappingURL=TimetravelPlayer.js.map