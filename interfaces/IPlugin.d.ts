import ICorePlugin, { ICorePluginClass } from './ICorePlugin';
import IClientPlugin, { IClientPluginClass } from './IClientPlugin';
declare type IPlugin = IClientPlugin | ICorePlugin;
export default IPlugin;
export declare type IPluginClass = IClientPluginClass | ICorePluginClass;
