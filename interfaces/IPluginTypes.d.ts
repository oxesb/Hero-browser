declare const PluginTypes: {
    readonly ClientPlugin: "ClientPlugin";
    readonly CorePlugin: "CorePlugin";
};
declare type IPluginType = keyof typeof PluginTypes;
export { PluginTypes, IPluginType };
