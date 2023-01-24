"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requirePlugins_1 = require("@ulixee/hero-plugin-utils/lib/utils/requirePlugins");
const IPluginTypes_1 = require("@ulixee/hero-interfaces/IPluginTypes");
const index_1 = require("../index");
class CorePlugins {
    constructor(agent, options) {
        this.instanceById = {};
        const { dependencyMap, corePluginPaths, getSessionSummary } = options;
        this.agent = agent;
        if (getSessionSummary)
            this.getSessionSummary = getSessionSummary;
        else
            this.getSessionSummary = () => ({
                id: null,
                options: {},
            });
        this.logger = agent.logger.createChild(module);
        for (const plugin of Object.values(index_1.default.corePluginsById)) {
            if (plugin.shouldActivate?.(agent.emulationProfile, getSessionSummary()) === false)
                continue;
            this.use(plugin);
        }
        if (index_1.default.allowDynamicPluginLoading) {
            if (corePluginPaths) {
                this.loadCorePluginPaths(corePluginPaths);
            }
            if (dependencyMap) {
                this.loadDependencies(dependencyMap);
            }
        }
        this.configure(agent.emulationProfile);
    }
    get sessionSummary() {
        return this.getSessionSummary();
    }
    get instances() {
        return Object.values(this.instanceById);
    }
    cleanup() {
        this.getSessionSummary = () => null;
        this.instanceById = {};
        this.agent = null;
    }
    configure(options) {
        this.instances.forEach(p => p.configure?.(options));
    }
    async onPluginCommand(toPluginId, commandMeta, args) {
        const plugin = this.instanceById[toPluginId];
        if (plugin && plugin.onClientCommand) {
            return await plugin.onClientCommand({
                page: commandMeta.page,
                frame: commandMeta.frame,
            }, ...args);
        }
        this.logger.warn(`Plugin (${toPluginId}) could not be found for command`);
    }
    // ADDING PLUGINS TO THE STACK
    use(CorePlugin) {
        if (this.instanceById[CorePlugin.id])
            return;
        const corePlugin = new CorePlugin({
            emulationProfile: this.agent.emulationProfile,
            logger: this.logger,
            corePlugins: this,
            sessionSummary: this.sessionSummary,
        });
        this.instances.push(corePlugin);
        this.instanceById[corePlugin.id] = corePlugin;
        this.agent.hook(corePlugin);
    }
    loadDependencies(dependencyMap) {
        for (const [clientPluginId, corePluginIds] of Object.entries(dependencyMap)) {
            for (const corePluginId of corePluginIds) {
                if (this.instanceById[corePluginId])
                    continue;
                if (index_1.default.corePluginsById[corePluginId])
                    continue;
                this.logger.info(`Dynamically requiring ${corePluginId} requested by ${clientPluginId}`);
                const Plugin = (0, requirePlugins_1.default)(corePluginId, IPluginTypes_1.PluginTypes.CorePlugin)[0];
                if (!Plugin)
                    throw new Error(`Could not find ${corePluginId}`);
                this.use(Plugin);
            }
        }
    }
    loadCorePluginPaths(corePluginPaths) {
        for (const corePluginPath of corePluginPaths) {
            if (index_1.default.corePluginsById[corePluginPath])
                continue;
            const Plugins = (0, requirePlugins_1.default)(corePluginPath, IPluginTypes_1.PluginTypes.CorePlugin);
            Plugins.forEach(Plugin => this.use(Plugin));
        }
    }
}
exports.default = CorePlugins;
//# sourceMappingURL=CorePlugins.js.map