import ICorePlugin, { ICorePluginClass, IOnClientCommandMeta, ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import ICorePlugins from '@ulixee/hero-interfaces/ICorePlugins';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import Agent from '@ulixee/unblocked-agent/lib/Agent';
interface IOptionsCreate {
    dependencyMap?: IDependencyMap;
    corePluginPaths?: string[];
    getSessionSummary?: () => ISessionSummary;
}
interface IDependencyMap {
    [clientPluginId: string]: string[];
}
export default class CorePlugins implements ICorePlugins {
    get sessionSummary(): ISessionSummary;
    get instances(): ICorePlugin[];
    private instanceById;
    private readonly logger;
    private agent;
    private getSessionSummary;
    constructor(agent: Agent, options: IOptionsCreate);
    cleanup(): void;
    configure(options: IEmulationProfile): void;
    onPluginCommand(toPluginId: string, commandMeta: Pick<IOnClientCommandMeta, 'page' | 'frame'>, args: any[]): Promise<any>;
    use(CorePlugin: ICorePluginClass): void;
    private loadDependencies;
    private loadCorePluginPaths;
}
export {};
