"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationTrigger = exports.Session = exports.Tab = void 0;
const Fs = require("fs");
const Path = require("path");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
Object.defineProperty(exports, "LocationTrigger", { enumerable: true, get: function () { return Location_1.LocationTrigger; } });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const IPluginTypes_1 = require("@ulixee/hero-interfaces/IPluginTypes");
const extractPlugins_1 = require("@ulixee/hero-plugin-utils/lib/utils/extractPlugins");
const requirePlugins_1 = require("@ulixee/hero-plugin-utils/lib/utils/requirePlugins");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const Pool_1 = require("@ulixee/unblocked-agent/lib/Pool");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const default_browser_emulator_1 = require("@ulixee/default-browser-emulator");
const default_human_emulator_1 = require("@ulixee/default-human-emulator");
const EmittingTransportToClient_1 = require("@ulixee/net/lib/EmittingTransportToClient");
const SessionsDb_1 = require("./dbs/SessionsDb");
const NetworkDb_1 = require("./dbs/NetworkDb");
const env_1 = require("./env");
const Tab_1 = require("./lib/Tab");
exports.Tab = Tab_1.default;
const Session_1 = require("./lib/Session");
exports.Session = Session_1.default;
const ConnectionToHeroClient_1 = require("./connections/ConnectionToHeroClient");
const { log } = (0, Logger_1.default)(module);
class Core {
    static get defaultUnblockedPlugins() {
        if (this.pool)
            return this.pool.plugins;
        return this._defaultUnblockedPlugins;
    }
    static set defaultUnblockedPlugins(value) {
        this._defaultUnblockedPlugins = value;
        if (this.pool)
            this.pool.plugins = value;
    }
    static get dataDir() {
        return this._dataDir;
    }
    static set dataDir(dir) {
        const absoluteDataDir = Path.isAbsolute(dir) ? dir : Path.join(process.cwd(), dir);
        if (!Fs.existsSync(`${absoluteDataDir}`)) {
            Fs.mkdirSync(`${absoluteDataDir}`, { recursive: true });
        }
        this._dataDir = absoluteDataDir;
    }
    static addConnection(transportToClient) {
        transportToClient ?? (transportToClient = new EmittingTransportToClient_1.default());
        const connection = new ConnectionToHeroClient_1.default(transportToClient, this.clearIdleConnectionsAfterMillis);
        connection.once('disconnected', () => this.connections.delete(connection));
        this.connections.add(connection);
        return connection;
    }
    static use(PluginObject) {
        let Plugins;
        if (typeof PluginObject === 'string') {
            Plugins = (0, requirePlugins_1.default)(PluginObject);
        }
        else {
            Plugins = (0, extractPlugins_1.default)(PluginObject);
        }
        for (const Plugin of Plugins) {
            if (Plugin.type === IPluginTypes_1.PluginTypes.CorePlugin) {
                this.corePluginsById[Plugin.id] = Plugin;
            }
        }
    }
    static getUtilityContext() {
        if (this.utilityBrowserContext)
            return this.utilityBrowserContext;
        this.utilityBrowserContext = this.pool
            .getBrowser(default_browser_emulator_1.default.default(), {}, {
            showChrome: false,
        })
            .then(browser => browser.newContext({ logger: log, isIncognito: true }));
        return this.utilityBrowserContext;
    }
    static async start(options = {}) {
        if (this.isStarting)
            return;
        const startLogId = log.info('Core.start', {
            options,
            sessionId: null,
        });
        this.isClosing = null;
        this.isStarting = true;
        this.registerSignals(options.shouldShutdownOnSignals);
        const { maxConcurrentClientCount } = options;
        if (options.dataDir !== undefined) {
            Core.dataDir = options.dataDir;
        }
        this.networkDb = new NetworkDb_1.default();
        if (options.defaultUnblockedPlugins)
            this.defaultUnblockedPlugins = options.defaultUnblockedPlugins;
        this.pool = new Pool_1.default({
            certificateStore: this.networkDb.certificates,
            dataDir: Core.dataDir,
            logger: log.createChild(module),
            maxConcurrentAgents: maxConcurrentClientCount,
            plugins: this.defaultUnblockedPlugins,
        });
        // @ts-ignore
        this.pool.addEventEmitter(this.events, [
            'all-browsers-closed',
            'browser-has-no-open-windows',
            'browser-launched',
        ]);
        await this.pool.start();
        log.info('Core started', {
            sessionId: null,
            parentLogId: startLogId,
            dataDir: Core.dataDir,
        });
    }
    static async shutdown() {
        if (this.isClosing)
            return this.isClosing;
        const isClosing = new Resolvable_1.default();
        this.isClosing = isClosing.promise;
        ShutdownHandler_1.default.unregister(this.shutdown);
        this.isStarting = false;
        const logid = log.info('Core.shutdown');
        let shutDownErrors = [];
        try {
            shutDownErrors = await Promise.all([
                ...[...this.connections].map(x => x.disconnect().catch(err => err)),
                this.utilityBrowserContext?.then(x => x.close()).catch(err => err),
                this.pool?.close().catch(err => err),
            ]);
            shutDownErrors = shutDownErrors.filter(Boolean);
            this.utilityBrowserContext = null;
            this.networkDb?.close();
            SessionsDb_1.default.shutdown();
            if (this.onShutdown)
                this.onShutdown();
            await ShutdownHandler_1.default.run();
            isClosing.resolve();
        }
        catch (error) {
            isClosing.reject(error);
        }
        finally {
            log.info('Core.shutdownComplete', {
                parentLogId: logid,
                sessionId: null,
                errors: shutDownErrors.length ? shutDownErrors : undefined,
            });
        }
        return isClosing.promise;
    }
    static registerSignals(shouldShutdownOnSignals = true) {
        if (this.didRegisterSignals)
            return;
        this.didRegisterSignals = true;
        if (!shouldShutdownOnSignals)
            ShutdownHandler_1.default.disableSignals = true;
        this.shutdown = this.shutdown.bind(this);
        ShutdownHandler_1.default.register(this.shutdown);
        if (process.env.NODE_ENV !== 'test') {
            process.on('uncaughtExceptionMonitor', async (error) => {
                if (!error || error[Logger_1.hasBeenLoggedSymbol])
                    return;
                log.error('UnhandledError(fatal)', { error, sessionId: null });
                if (shouldShutdownOnSignals)
                    await ShutdownHandler_1.default.run();
            });
            process.on('unhandledRejection', (error) => {
                if (!error || error[Logger_1.hasBeenLoggedSymbol])
                    return;
                log.error('UnhandledRejection', { error, sessionId: null });
            });
        }
    }
}
exports.default = Core;
Core.events = new eventUtils_1.TypedEventEmitter();
Core.connections = new Set();
Core.corePluginsById = {};
Core.allowDynamicPluginLoading = true;
Core.clearIdleConnectionsAfterMillis = -1;
Core.isStarting = false;
Core.didRegisterSignals = false;
Core._dataDir = env_1.dataDir;
Core._defaultUnblockedPlugins = [
    default_browser_emulator_1.default,
    default_human_emulator_1.default,
];
//# sourceMappingURL=index.js.map