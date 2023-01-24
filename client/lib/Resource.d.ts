/// <reference types="node" />
import IResourceType from '@ulixee/unblocked-specification/agent/net/IResourceType';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import CoreTab from './CoreTab';
import ResourceRequest from './ResourceRequest';
import ResourceResponse from './ResourceResponse';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import { InternalPropertiesSymbol } from './internal';
import Tab from './Tab';
import IWaitForResourcesFilter from '../interfaces/IWaitForResourcesFilter';
export default class Resource {
    #private;
    readonly id: number;
    readonly url: string;
    readonly type: IResourceType;
    readonly documentUrl: string;
    readonly isRedirect?: boolean;
    readonly request: ResourceRequest;
    readonly response: ResourceResponse;
    get [InternalPropertiesSymbol](): {
        coreTabPromise: Promise<CoreTab>;
        resourceMeta: IResourceMeta;
    };
    constructor(coreTabPromise: Promise<CoreTab>, resourceMeta: IResourceMeta);
    get buffer(): Promise<Buffer>;
    get text(): Promise<string>;
    get json(): Promise<any>;
    $detach(): Promise<void>;
    $addToDetachedResources(name: string): Promise<void>;
    static findLatest(tab: Tab, filter: IResourceFilterProperties, options: {
        sinceCommandId: number;
    }): Promise<Resource>;
    static findAll(tab: Tab, filter: IResourceFilterProperties, options: {
        sinceCommandId: number;
    }): Promise<Resource[]>;
    static waitForOne(tab: Tab, filter: IWaitForResourceFilter, options: IWaitForResourceOptions): Promise<Resource>;
    static waitForMany(tab: Tab, filter: IWaitForResourcesFilter, options: IWaitForResourceOptions): Promise<Resource[]>;
}
export declare function createResource(coreTab: Promise<CoreTab>, resourceMeta: IResourceMeta): Resource;
