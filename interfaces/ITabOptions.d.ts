export default interface ITabOptions {
    blockedResourceTypes?: IBlockedResourceType[];
    blockedResourceUrls?: (string | RegExp)[];
}
export declare enum BlockedResourceType {
    JsRuntime = "JsRuntime",
    BlockJsResources = "BlockJsResources",
    BlockCssResources = "BlockCssResources",
    BlockImages = "BlockImages",
    BlockFonts = "BlockFonts",
    BlockIcons = "BlockIcons",
    BlockMedia = "BlockMedia",
    BlockAssets = "BlockAssets",
    All = "All",
    None = "None"
}
export declare type IBlockedResourceType = keyof typeof BlockedResourceType;
