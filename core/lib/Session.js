"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nanoid_1 = require("nanoid");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const Tab_1 = require("./Tab");
const UserProfile_1 = require("./UserProfile");
const InjectedScripts_1 = require("./InjectedScripts");
const CommandRecorder_1 = require("./CommandRecorder");
const CorePlugins_1 = require("./CorePlugins");
const index_1 = require("../index");
const SessionDb_1 = require("../dbs/SessionDb");
const Commands_1 = require("./Commands");
const SessionsDb_1 = require("../dbs/SessionsDb");
const env_1 = require("../env");
const { log } = (0, Logger_1.default)(module);
class Session extends eventUtils_1.TypedEventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.tabsById = new Map();
        this.awaitedEventEmitter = new eventUtils_1.TypedEventEmitter();
        this.hasLoadedUserProfile = false;
        this._isClosing = false;
        this.isResettingState = false;
        this.events = new EventSubscriber_1.default();
        ['showChrome', 'showChromeAlive', 'showChromeInteractions', 'sessionKeepAlive'].forEach(k => {
            if (!(k in options))
                return;
            const v = options[k];
            options[k] = Boolean(typeof v === 'string' ? JSON.parse(v.toLowerCase()) : v);
        });
        this.createdTime = Date.now();
        this.id = this.getId(options.sessionId);
        const id = this.id;
        Session.byId[id] = this;
        this.db = new SessionDb_1.default(this.id);
        this.commands = new Commands_1.default(this.db);
        this.logger = log.createChild(module, { sessionId: this.id });
        Logger_1.loggerSessionIdNames.set(this.id, options.sessionName);
        this.logSubscriptionId = Logger_1.LogEvents.subscribe(this.recordLog.bind(this));
        const providedOptions = { ...options };
        // set default script instance if not provided
        options.scriptInstanceMeta ?? (options.scriptInstanceMeta = {
            id: (0, nanoid_1.nanoid)(),
            workingDirectory: process.cwd(),
            entrypoint: require.main?.filename ?? process.argv[1],
            startDate: this.createdTime,
        });
        // add env vars
        options.showChrome ?? (options.showChrome = env_1.default.showChrome);
        options.noChromeSandbox ?? (options.noChromeSandbox = env_1.default.noChromeSandbox);
        options.disableGpu ?? (options.disableGpu = env_1.default.disableGpu);
        options.disableMitm ?? (options.disableMitm = env_1.default.disableMitm);
        Session.events.emit('new', { session: this });
        // if no settings for chrome visibility, default to headless
        options.showChrome ?? (options.showChrome = false);
        options.showChromeInteractions ?? (options.showChromeInteractions = options.showChrome);
        const { userProfile, userAgent } = options;
        const customEmulatorConfig = {
            userAgentSelector: userAgent ?? userProfile?.userAgentString,
        };
        this.agent = index_1.default.pool.createAgent({
            options,
            customEmulatorConfig,
            logger: this.logger,
            deviceProfile: userProfile?.deviceProfile,
            id: this.id,
            commandMarker: this.commands,
        });
        this.plugins = new CorePlugins_1.default(this.agent, {
            corePluginPaths: options.corePluginPaths,
            dependencyMap: options.dependencyMap,
            getSessionSummary: this.getSummary.bind(this),
        });
        // should come after plugins can initiate
        this.recordSession(providedOptions);
        SessionsDb_1.default.find().recordSession(this);
        this.commandRecorder = new CommandRecorder_1.default(this, this, null, null, [
            this.setSnippet,
            this.getSnippets,
            this.getDetachedElements,
            this.getDetachedResources,
            this.getCollectedAssetNames,
            this.close,
            this.flush,
            this.exportUserProfile,
            this.getTabs,
            this.getHeroMeta,
            this.addRemoteEventListener,
            this.removeRemoteEventListener,
            this.pauseCommands,
            this.resumeCommands,
        ]);
    }
    get browserEngine() {
        return this.emulationProfile.browserEngine;
    }
    get userProfile() {
        return this.options.userProfile;
    }
    get mode() {
        return this.options.mode;
    }
    get viewport() {
        return this.emulationProfile.viewport;
    }
    get mitmRequestSession() {
        return this.agent.mitmRequestSession;
    }
    get resources() {
        return this.browserContext.resources;
    }
    get websocketMessages() {
        return this.browserContext.websocketMessages;
    }
    get isClosing() {
        return this._isClosing;
    }
    get emulationProfile() {
        return this.agent?.emulationProfile;
    }
    get meta() {
        const { viewport, locale, timezoneId, geolocation, windowNavigatorPlatform } = this.emulationProfile;
        const { string: userAgentString, operatingSystemName, operatingSystemVersion, uaClientHintsPlatformVersion, browserVersion, browserName, } = this.emulationProfile.userAgentOption ?? {};
        return {
            sessionId: this.id,
            ...this.options,
            upstreamProxyUrl: this.options.upstreamProxyUrl,
            upstreamProxyIpMask: this.options.upstreamProxyIpMask,
            viewport,
            locale,
            timezoneId,
            geolocation,
            userAgentString,
            operatingSystemName,
            uaClientHintsPlatformVersion,
            windowNavigatorPlatform,
            operatingSystemVersion: [
                operatingSystemVersion.major,
                operatingSystemVersion.minor,
                operatingSystemVersion.patch,
                operatingSystemVersion.build,
            ]
                .filter(x => x !== undefined)
                .join('.'),
            browserName,
            browserFullVersion: [
                browserVersion.major,
                browserVersion.minor,
                browserVersion.patch,
                browserVersion.build,
            ]
                .filter(x => x !== undefined)
                .join('.'),
            renderingEngine: this.browserEngine.name,
            renderingEngineVersion: this.browserEngine.fullVersion,
        };
    }
    getSummary() {
        return {
            id: this.id,
            options: { ...this.options },
        };
    }
    isAllowedCommand(method) {
        return this.commandRecorder.fnNames.has(method) || method === 'recordOutput';
    }
    shouldWaitForCommandLock(method) {
        return method !== 'resumeCommands';
    }
    getTab(id) {
        return this.tabsById.get(id);
    }
    getTabs() {
        return Promise.resolve([...this.tabsById.values()].filter(x => !x.isClosing));
    }
    flush() {
        this.logger.info('SessionFlushing');
        return Promise.resolve();
    }
    getHeroMeta() {
        return Promise.resolve(this.meta);
    }
    setSnippet(key, value, timestamp) {
        const asset = this.db.snippets.insert(key, value, timestamp, this.commands.lastId);
        this.emit('collected-asset', { type: 'snippet', asset });
        return Promise.resolve();
    }
    getCollectedAssetNames(fromSessionId) {
        let db = this.db;
        if (fromSessionId === this.id) {
            db.flush();
        }
        else {
            db = SessionDb_1.default.getCached(fromSessionId);
        }
        const snippets = new Set();
        for (const snippet of db.snippets.all()) {
            snippets.add(snippet.name);
        }
        const resources = new Set();
        for (const resource of db.detachedResources.all()) {
            resources.add(resource.name);
        }
        const elementNames = db.detachedElements.allNames();
        return Promise.resolve({
            snippets: [...snippets],
            resources: [...resources],
            elements: [...elementNames],
        });
    }
    getSnippets(fromSessionId, name) {
        let db = this.db;
        if (fromSessionId === this.id) {
            db.flush();
        }
        else {
            db = SessionDb_1.default.getCached(fromSessionId);
        }
        return Promise.resolve(db.snippets.getByName(name));
    }
    getDetachedResources(fromSessionId, name) {
        let db = this.db;
        if (fromSessionId === this.id) {
            db.flush();
        }
        else {
            db = SessionDb_1.default.getCached(fromSessionId);
        }
        const resources = db.detachedResources.getByName(name).map(async (x) => {
            const resource = await db.resources.getMeta(x.resourceId, true);
            const detachedResource = {
                ...x,
                resource,
            };
            if (resource.type === 'Websocket') {
                detachedResource.websocketMessages = db.websocketMessages.getTranslatedMessages(resource.id);
            }
            return detachedResource;
        });
        return Promise.all(resources);
    }
    async getDetachedElements(fromSessionId, name) {
        let db = this.db;
        if (!fromSessionId || fromSessionId === this.id) {
            for (const tab of this.tabsById.values()) {
                await tab.pendingCollects();
            }
        }
        else {
            db = SessionDb_1.default.getCached(fromSessionId);
        }
        db.flush();
        return db.detachedElements.getByName(name);
    }
    async openBrowser() {
        if (this.mode === 'browserless')
            return;
        const agent = this.agent;
        await agent.open();
        this.browserContext = agent.browserContext;
        this.events.on(agent.browserContext.devtoolsSessionLogger, 'devtools-message', this.onDevtoolsMessage.bind(this));
        if (this.userProfile) {
            await UserProfile_1.default.installCookies(this);
        }
        this.browserContext.defaultPageInitializationFn = page => InjectedScripts_1.default.install(page, this.options.showChromeInteractions);
        const requestSession = agent.mitmRequestSession;
        requestSession.bypassResourceRegistrationForHost = this.bypassResourceRegistrationForHost;
        this.events.on(requestSession, 'resource-state', this.onResourceStates.bind(this));
        this.events.on(requestSession, 'socket-close', this.onSocketClose.bind(this));
        this.events.on(requestSession, 'socket-connect', this.onSocketConnect.bind(this));
        const resources = this.browserContext.resources;
        this.events.on(resources, 'change', this.onResource.bind(this));
        this.events.on(resources, 'cookie-change', this.onCookieChange.bind(this));
        this.events.on(resources, 'merge', this.onResourceNeedsMerge.bind(this));
        this.events.on(resources, 'browser-loaded', this.onBrowserLoadedResource.bind(this));
        this.events.on(resources, 'browser-requested', this.onBrowserRequestedResource.bind(this));
        this.events.on(this.websocketMessages, 'new', this.onWebsocketMessage.bind(this));
        agent.mitmRequestSession.respondWithHttpErrorStacks =
            this.mode === 'development' && this.options.showChromeInteractions === true;
        if (this.options.upstreamProxyIpMask) {
            this.db.session.updateConfiguration(this.meta);
        }
    }
    exportUserProfile() {
        return UserProfile_1.default.export(this);
    }
    async createTab() {
        if (this.mode === 'browserless')
            return null;
        let page;
        // register dom script before page is initialized
        this.agent.plugins.addDomOverride('page', InjectedScripts_1.default.ShadowDomPiercerScript, { callbackName: 'onShadowDomPushedCallbackFn' }, (data, frame) => {
            const tab = this.tabsById.get(frame.page.tabId);
            if (tab) {
                void tab.frameEnvironmentsById.get(frame.frameId)?.onShadowDomPushed(data);
            }
        });
        // if first tab, install session storage
        if (!this.hasLoadedUserProfile && this.userProfile?.storage) {
            page = await this.browserContext.newPage({
                groupName: 'session',
                runPageScripts: false,
                enableDomStorageTracker: false,
            });
            await UserProfile_1.default.installStorage(this, page);
            this.hasLoadedUserProfile = true;
        }
        else {
            page = await this.browserContext.newPage({
                groupName: 'session',
            });
        }
        const first = this.tabsById.size === 0;
        const tab = Tab_1.default.create(this, page);
        this.recordTab(tab);
        this.registerTab(tab);
        await tab.isReady;
        if (first)
            this.db.session.updateConfiguration(this.meta);
        return tab;
    }
    getLastActiveTab() {
        if (!this.commands)
            return null;
        for (let idx = this.commands.history.length - 1; idx >= 0; idx -= 1) {
            const command = this.commands.history[idx];
            if (command.tabId) {
                const tab = this.tabsById.get(command.tabId);
                if (tab && !tab.isClosing)
                    return tab;
            }
        }
        // if there are open tabs, send these as next option
        for (const tab of this.tabsById.values()) {
            if (!tab.isClosing)
                return tab;
        }
        return null;
    }
    async resetStorage() {
        const securityOrigins = new Set();
        this.isResettingState = true;
        try {
            for (const tab of this.tabsById.values()) {
                const clearPromises = [];
                for (const frame of tab.frameEnvironmentsById.values()) {
                    const origin = frame.frame.securityOrigin;
                    if (!securityOrigins.has(origin)) {
                        const promise = tab.page.devtoolsSession
                            .send('Storage.clearDataForOrigin', {
                            origin,
                            storageTypes: 'all',
                        })
                            .catch(err => err);
                        clearPromises.push(promise);
                        securityOrigins.add(origin);
                    }
                }
                await Promise.all(clearPromises);
                await tab.close();
            }
            // after we're all the way cleared, install user profile again
            if (this.userProfile) {
                await UserProfile_1.default.installCookies(this);
            }
            // pop a new tab on
            await this.createTab();
        }
        finally {
            this.isResettingState = false;
        }
    }
    async closeTabs() {
        try {
            const promises = [];
            for (const tab of this.tabsById.values()) {
                promises.push(tab.close());
            }
            await Promise.all(promises);
        }
        catch (error) {
            log.error('Session.CloseTabsError', { error, sessionId: this.id });
        }
    }
    async close(force = false) {
        // if this session is set to keep alive and core isn't closing
        if (!force &&
            this.options.sessionKeepAlive &&
            !index_1.default.isClosing &&
            !this.commands.requiresScriptRestart) {
            return await this.keepAlive();
        }
        if (this._isClosing)
            return;
        this._isClosing = true;
        await this.willClose();
        this.awaitedEventEmitter.emit('close');
        this.emit('closing');
        const start = log.info('Session.Closing', {
            sessionId: this.id,
        });
        await this.closeTabs();
        await this.agent.close();
        log.stats('Session.Closed', {
            sessionId: this.id,
            parentLogId: start,
        });
        const closedEvent = { waitForPromise: null };
        this.emit('closed', closedEvent);
        await closedEvent.waitForPromise;
        delete Session.byId[this.id];
        this.events.close();
        this.commandRecorder.cleanup();
        this.plugins.cleanup();
        // should go last so we can capture logs
        this.db.session.close(Date.now());
        Logger_1.LogEvents.unsubscribe(this.logSubscriptionId);
        Logger_1.loggerSessionIdNames.delete(this.id);
        this.db.flush();
        this.cleanup();
        this.removeAllListeners();
        try {
            await this.db.close(this.options.sessionPersistence === false);
        }
        catch (e) {
            /* no-op */
        }
        const databasePath = this.db.path;
        Session.events.emit('closed', { id: this.id, databasePath });
    }
    addRemoteEventListener(type, emitFn) {
        const listener = this.commands.observeRemoteEvents(type, emitFn);
        this.awaitedEventEmitter.on(type, listener.listenFn);
        return Promise.resolve({ listenerId: listener.id });
    }
    removeRemoteEventListener(listenerId) {
        const details = this.commands.getRemoteEventListener(listenerId);
        this.awaitedEventEmitter.off(details.type, details.listenFn);
        return Promise.resolve();
    }
    recordOutput(...changes) {
        for (const change of changes) {
            this.db.output.insert(change);
        }
        this.emit('output', { changes });
        return Promise.resolve();
    }
    pauseCommands() {
        this.commands.pause();
        return Promise.resolve();
    }
    resumeCommands() {
        this.commands.resume();
        return Promise.resolve();
    }
    async willClose() {
        const willCloseEvent = { waitForPromise: null };
        this.emit('will-close', willCloseEvent);
        await willCloseEvent.waitForPromise;
    }
    async keepAlive() {
        await this.willClose();
        const result = { didKeepAlive: false, message: null };
        result.message = `This session has the "sessionKeepAlive" variable active. Your Chrome session will remain open until you terminate this Hero instance.`;
        result.didKeepAlive = true;
        for (const tab of this.tabsById.values()) {
            await tab.flushDomChanges();
        }
        // give listeners a chance to modify message before publishing to clients
        this.emit('kept-alive', result);
        return result;
    }
    async resume(options) {
        if (options.resumeSessionStartLocation === 'sessionStart') {
            await this.resetStorage();
            // create a new tab
        }
        Object.assign(this.options, options);
        this.commands.presetMeta = null;
        this.emit('resumed');
    }
    getId(sessionId) {
        if (sessionId) {
            if (Session.byId[sessionId]) {
                throw new Error('The pre-provided sessionId is already in use.');
            }
            // make sure this is a valid sessionid
            if (/^[0-9a-zA-Z-_]{6,}/.test(sessionId) === false) {
                throw new Error('Unsupported sessionId format provided. Must be > 10 characters including: a-z, 0-9 and dashes.');
            }
        }
        return sessionId ?? (0, nanoid_1.nanoid)();
    }
    cleanup() {
        this.agent = null;
        this.commandRecorder = null;
        this.browserContext = null;
        this.plugins = null;
        this.commands = null;
    }
    onResource(event) {
        this.db.resources.insert(event.tabId, event.resource, event.postData, event.body, event.requestProcessingDetails, event.error);
        // don't broadcast intercepted resources
        if (event.type === 'mitm-response' && !event.requestProcessingDetails.wasIntercepted) {
            this.tabsById.get(event.tabId)?.emit('resource', event.resource);
        }
    }
    onWebsocketMessage(event) {
        this.db.websocketMessages.insert(event.lastCommandId, event.message);
    }
    onCookieChange(event) {
        this.db.storageChanges.insert(event.tabId, event.frameId, {
            type: 'cookie',
            action: event.action,
            securityOrigin: event.url.origin,
            key: event.cookie?.name,
            value: event.cookie?.value,
            meta: event.cookie,
            timestamp: event.timestamp,
        });
    }
    onResourceNeedsMerge(event) {
        this.db.resources.mergeWithExisting(event.resourceId, event.existingResource, event.newResourceDetails, event.requestProcessingDetails, event.error);
    }
    onBrowserLoadedResource(event) {
        this.db.resources.updateReceivedTime(event.resourceId, event.browserLoadedTime);
    }
    onBrowserRequestedResource(event) {
        this.db.resources.updateBrowserRequestId(event.resourceId, event);
    }
    onDevtoolsMessage(event) {
        this.db.devtoolsMessages.insert(event);
    }
    onResourceStates(event) {
        if (!this.browserContext.resources.isCollecting)
            return;
        this.db.resourceStates.insert(event.context.id, event.context.stateChanges);
    }
    onSocketClose(event) {
        if (!this.browserContext.resources.isCollecting)
            return;
        this.db.sockets.insert(event.socket);
    }
    onSocketConnect(event) {
        if (!this.browserContext.resources.isCollecting)
            return;
        this.db.sockets.insert(event.socket);
    }
    async onNewTab(parentTab, page, openParams) {
        const tab = Tab_1.default.create(this, page, parentTab?.id, openParams);
        this.recordTab(tab, parentTab.id);
        this.registerTab(tab);
        await tab.isReady;
        parentTab.emit('child-tab-created', tab);
        return tab;
    }
    registerTab(tab) {
        const id = tab.id;
        this.tabsById.set(id, tab);
        this.events.once(tab, 'close', () => {
            this.tabsById.delete(id);
            if (this.tabsById.size === 0 && !this.isResettingState) {
                this.emit('all-tabs-closed');
            }
        });
        tab.page.popupInitializeFn = this.onNewTab.bind(this, tab);
        this.emit('tab-created', { tab });
        return tab;
    }
    recordLog(entry) {
        if (entry.sessionId === this.id || !entry.sessionId) {
            if (entry.action === 'Window.runCommand')
                entry.data = { id: entry.data.id };
            if (entry.action === 'Window.ranCommand')
                entry.data = null;
            this.db.sessionLogs.insert(entry);
        }
    }
    recordTab(tab, parentTabId) {
        this.db.tabs.insert(tab.id, tab.page.id, tab.page.devtoolsSession.id, this.viewport, parentTabId);
    }
    recordSession(providedOptions) {
        if (!this.browserEngine) {
            let extraMessage = '.';
            if (this.options.userAgent)
                extraMessage = ` matching selector(${this.options.userAgent}).`;
            throw new Error(`Failed to select a browser engine${extraMessage}`);
        }
        const configuration = this.meta;
        const { sessionName, scriptInstanceMeta, ...optionsToStore } = providedOptions;
        this.db.session.insert(this.id, configuration, this.browserEngine.name, this.browserEngine.fullVersion, this.createdTime, scriptInstanceMeta, this.emulationProfile.deviceProfile, optionsToStore);
    }
    static restoreOptionsFromSessionRecord(options, resumeSessionId) {
        var _a;
        // if session not active, re-create
        let db;
        try {
            db = SessionDb_1.default.getCached(resumeSessionId, true);
        }
        catch (err) {
            // not found
        }
        if (!db) {
            const data = [
                ''.padEnd(50, '-'),
                `------HERO SESSION ID`.padEnd(50, '-'),
                `------${index_1.default.dataDir}`.padEnd(50, '-'),
                `------${resumeSessionId ?? ''}`.padEnd(50, '-'),
                ''.padEnd(50, '-'),
            ].join('\n');
            throw new Error(`You're trying to resume a Hero session that could not be located.
${data}`);
        }
        const record = db.session.get();
        if (record.createSessionOptions) {
            Object.assign(options, record.createSessionOptions);
        }
        options.userAgent = record.userAgentString;
        options.locale = record.locale;
        options.timezoneId = record.timezoneId;
        options.viewport = record.viewport;
        options.userProfile ?? (options.userProfile = {});
        (_a = options.userProfile).deviceProfile ?? (_a.deviceProfile = record.deviceProfile);
        return options;
    }
    static async create(options) {
        let session;
        let tab;
        let isSessionResume = false;
        // try to resume session. Modify options to match if not active.
        const { resumeSessionId, resumeSessionStartLocation } = options;
        if (resumeSessionId) {
            if (resumeSessionStartLocation !== 'sessionStart') {
                session = Session.get(resumeSessionId);
                if (session) {
                    await session.resume(options);
                    tab = session.getLastActiveTab();
                    isSessionResume = true;
                    session.logger.info('Continuing session', { options });
                }
            }
            if (!session) {
                Session.restoreOptionsFromSessionRecord(options, resumeSessionId);
            }
        }
        if (!session) {
            await index_1.default.start();
            session = new Session(options);
            await session.openBrowser();
        }
        tab ?? (tab = await session.createTab());
        if (resumeSessionId) {
            if (resumeSessionStartLocation === 'sessionStart' && session.id !== resumeSessionId) {
                const newId = session.id;
                const resumed = Session.get(resumeSessionId);
                // Bind the new session close to the original one if it's still open
                if (resumed) {
                    resumed.logger.info('Session resumed from start.', { options });
                    resumed.events.once(resumed, 'closed', () => Session.get(newId)?.close(true));
                }
            }
            // Broadcast new event kept-alive to the original session
            session.events.on(session, 'kept-alive', () => {
                const resumed = Session.get(resumeSessionId);
                if (resumed) {
                    resumed.awaitedEventEmitter.emit('rerun-kept-alive');
                }
            });
        }
        return { session, tab, isSessionResume };
    }
    static get(sessionId) {
        if (!sessionId)
            return null;
        return this.byId[sessionId];
    }
    static getTab(meta) {
        if (!meta)
            return undefined;
        const session = this.get(meta.sessionId);
        if (!session)
            return undefined;
        return session.tabsById.get(meta.tabId);
    }
    static hasKeepAliveSessions() {
        for (const session of Object.values(this.byId)) {
            if (session.options.sessionKeepAlive)
                return true;
        }
        return false;
    }
    static sessionsWithBrowserId(browserId) {
        return Object.values(this.byId).filter(x => x.browserContext?.browserId === browserId);
    }
}
exports.default = Session;
Session.events = new eventUtils_1.TypedEventEmitter();
Session.byId = {};
//# sourceMappingURL=Session.js.map