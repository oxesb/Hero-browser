"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const readline = require("readline");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const CoreCommandQueue_1 = require("./CoreCommandQueue");
const CoreEventHeap_1 = require("./CoreEventHeap");
const CoreTab_1 = require("./CoreTab");
class CoreSession extends eventUtils_1.TypedEventEmitter {
    constructor(sessionMeta, connectionToCore, options) {
        super();
        this.tabsById = new Map();
        this.emitter = new events_1.EventEmitter();
        this.commandId = 0;
        this.isClosing = false;
        const { sessionName, mode } = options;
        this.mode = mode;
        const { sessionId } = sessionMeta;
        this.sessionId = sessionId;
        this.sessionName = sessionName;
        this.meta = {
            sessionId,
        };
        this.connectionToCore = connectionToCore;
        Logger_1.loggerSessionIdNames.set(sessionId, sessionName);
        this.commandQueue = new CoreCommandQueue_1.default({ sessionId, sessionName }, mode, connectionToCore, this);
        this.eventHeap = new CoreEventHeap_1.default(this.meta, connectionToCore, this);
        this.addTab(sessionMeta);
    }
    get lastCommandId() {
        return this.commandId;
    }
    get nextCommandId() {
        this.commandId += 1;
        return this.commandId;
    }
    get firstTab() {
        return [...this.tabsById.values()][0];
    }
    onEvent(meta, listenerId, eventData, lastCommandId) {
        if (lastCommandId && lastCommandId > this.commandId) {
            this.commandId = lastCommandId;
        }
        if (meta.tabId) {
            const coreTab = this.tabsById.get(meta.tabId);
            coreTab?.eventHeap?.incomingEvent(meta, listenerId, eventData);
        }
        else {
            this.eventHeap.incomingEvent(meta, listenerId, eventData);
        }
    }
    getHeroMeta() {
        return this.commandQueue.run('Session.getHeroMeta');
    }
    async getTabs() {
        const tabSessionMetas = await this.commandQueue.run('Session.getTabs');
        for (const tabMeta of tabSessionMetas) {
            this.addTab(tabMeta);
        }
        return [...this.tabsById.values()];
    }
    addTab(tabMeta) {
        if (!this.tabsById.has(tabMeta.tabId)) {
            this.tabsById.set(tabMeta.tabId, new CoreTab_1.default({ ...tabMeta, sessionName: this.sessionName }, this.connectionToCore, this));
        }
        return this.tabsById.get(tabMeta.tabId);
    }
    removeTab(tab) {
        this.tabsById.delete(tab.tabId);
    }
    // START OF PRIVATE APIS FOR DATASTORE /////////////////////////////////////////////////////////////
    recordOutput(changes) {
        for (const change of changes) {
            change.lastCommandId = this.lastCommandId;
        }
        this.commandQueue.record({ command: 'Session.recordOutput', args: changes });
    }
    async setSnippet(key, value) {
        await this.commandQueue.run('Session.setSnippet', key, value, Date.now());
    }
    async getCollectedAssetNames(sessionId) {
        return await this.commandQueue.run('Session.getCollectedAssetNames', sessionId);
    }
    async getSnippets(sessionId, name) {
        return await this.commandQueue.run('Session.getSnippets', sessionId, name);
    }
    async getDetachedElements(sessionId, name) {
        return await this.commandQueue.run('Session.getDetachedElements', sessionId, name);
    }
    async getDetachedResources(sessionId, name) {
        return await this.commandQueue.run('Session.getDetachedResources', sessionId, name);
    }
    // END OF PRIVATE APIS FOR DATASTORE ///////////////////////////////////////////////////////////////
    async close(force = false) {
        await this.closingPromise;
        if (this.isClosing)
            return;
        try {
            this.isClosing = true;
            this.closeCliPrompt();
            this.closingPromise = this.doClose(force);
            const result = await this.closingPromise;
            this.closingPromise = null;
            if (result?.didKeepAlive === true) {
                this.isClosing = false;
                const didClose = new Promise(resolve => this.addEventListener(null, 'close', resolve));
                await this.watchRelaunchLogs();
                this.showSessionKeepAlivePrompt(result.message);
                await didClose;
            }
        }
        finally {
            this.emit('close');
            Logger_1.loggerSessionIdNames.delete(this.sessionId);
        }
    }
    async addEventListener(jsPath, eventType, listenerFn, options) {
        if (eventType === 'command') {
            this.emitter.on(eventType, listenerFn);
        }
        else {
            await this.eventHeap.addListener(jsPath, eventType, listenerFn, options);
        }
    }
    async removeEventListener(jsPath, eventType, listenerFn) {
        if (eventType === 'command') {
            this.emitter.off(eventType, listenerFn);
        }
        else {
            await this.eventHeap.removeListener(jsPath, eventType, listenerFn);
        }
    }
    async pause() {
        await this.commandQueue.run('Session.pauseCommands');
    }
    async doClose(force) {
        await this.commandQueue.flush();
        for (const tab of this.tabsById.values()) {
            await tab.flush();
        }
        return await this.commandQueue.runOutOfBand('Session.close', force);
    }
    closeCliPrompt() {
        if (this.cliPrompt) {
            this.cliPrompt.close();
            this.cliPrompt = null;
        }
    }
    async watchRelaunchLogs() {
        await this.addEventListener(null, 'rerun-stdout', msg => process.stdout.write(msg));
        await this.addEventListener(null, 'rerun-stderr', msg => process.stderr.write(msg));
        await this.addEventListener(null, 'rerun-kept-alive', () => {
            // eslint-disable-next-line no-console
            console.log(this.cliPromptMessage);
        });
    }
    showSessionKeepAlivePrompt(message) {
        this.cliPromptMessage = `\n\n${message}\n\nPress Q or kill the CLI to exit and close Chrome:\n\n`;
        if (/yes|1|true/i.test(process.env.ULX_CLI_NOPROMPT))
            return;
        this.cliPrompt = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setEncoding('utf8');
        if (process.stdin.isTTY)
            process.stdin.setRawMode(true);
        this.cliPrompt.setPrompt(this.cliPromptMessage);
        process.stdin.on('keypress', async (chunk, key) => {
            if (key.name?.toLowerCase() === 'q' ||
                (key.name?.toLowerCase() === 'c' && key.ctrl === true)) {
                try {
                    await this.close(true);
                }
                catch (error) {
                    if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                        return;
                    throw error;
                }
            }
        });
        ShutdownHandler_1.default.register(() => this.closeCliPrompt());
        this.cliPrompt.prompt(true);
    }
}
exports.default = CoreSession;
//# sourceMappingURL=CoreSession.js.map