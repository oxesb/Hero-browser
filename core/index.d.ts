import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import { LocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';
import { ICorePluginClass } from '@ulixee/hero-interfaces/ICorePlugin';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import Pool from '@ulixee/unblocked-agent/lib/Pool';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
import { IUnblockedPluginClass } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import ITransportToClient from '@ulixee/net/interfaces/ITransportToClient';
import Tab from './lib/Tab';
import Session from './lib/Session';
import ConnectionToHeroClient from './connections/ConnectionToHeroClient';
export { Tab, Session, LocationTrigger };
export default class Core {
    static get defaultUnblockedPlugins(): IUnblockedPluginClass[];
    static set defaultUnblockedPlugins(value: IUnblockedPluginClass[]);
    static get dataDir(): string;
    static set dataDir(dir: string);
    static events: TypedEventEmitter<Pick<{
        'agent-created': {
            agent: import("@ulixee/unblocked-agent/lib/Agent").default;
        };
        'browser-launched': {
            browser: import("@ulixee/unblocked-agent/lib/Browser").default;
        };
        'browser-has-no-open-windows': {
            browser: import("@ulixee/unblocked-agent/lib/Browser").default;
        };
        'all-browsers-closed': void;
    }, "browser-has-no-open-windows" | "browser-launched" | "all-browsers-closed">>;
    static readonly connections: Set<ConnectionToHeroClient>;
    static corePluginsById: {
        [id: string]: ICorePluginClass;
    };
    static onShutdown: () => void;
    static pool: Pool;
    static allowDynamicPluginLoading: boolean;
    static isClosing: Promise<void>;
    static clearIdleConnectionsAfterMillis: number;
    private static isStarting;
    private static didRegisterSignals;
    private static _dataDir;
    private static _defaultUnblockedPlugins;
    private static networkDb;
    private static utilityBrowserContext;
    static addConnection(transportToClient?: ITransportToClient<any>): ConnectionToHeroClient;
    static use(PluginObject: string | ICorePluginClass | {
        [name: string]: IPluginClass;
    }): void;
    static getUtilityContext(): Promise<BrowserContext>;
    static start(options?: ICoreConfigureOptions): Promise<void>;
    static shutdown(): Promise<void>;
    private static registerSignals;
}
