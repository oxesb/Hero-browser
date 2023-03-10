export default interface ITabOptions {
  blockedResourceTypes?: IBlockedResourceType[];
  blockedResourceUrls?: (string | RegExp)[];
}

export enum BlockedResourceType {
  JsRuntime = 'JsRuntime',
  BlockJsResources = 'BlockJsResources',
  BlockCssResources = 'BlockCssResources',
  BlockImages = 'BlockImages',
  BlockFonts = 'BlockFonts',
  BlockIcons = 'BlockIcons',
  BlockMedia = 'BlockMedia',
  BlockAssets = 'BlockAssets',
  All = 'All',
  None = 'None',
}

export type IBlockedResourceType = keyof typeof BlockedResourceType;
