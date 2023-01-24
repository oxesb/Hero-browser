/// <reference types="node" />
import { IInteractionGroups } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { ILoadStatus, ILocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';
import { IJsPath, INodeVisibility, INodePointer } from '@ulixee/js-path';
import { ICookie } from '@ulixee/unblocked-specification/agent/net/ICookie';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';
import IExecJsPathResult from '@ulixee/unblocked-specification/agent/browser/IExecJsPathResult';
import { IRequestInit } from '@ulixee/awaited-dom/base/interfaces/official';
import ISetCookieOptions from '@ulixee/hero-interfaces/ISetCookieOptions';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import { IElementIsolate, INodeIsolate } from '@ulixee/awaited-dom/base/interfaces/isolate';
import { ISuperElement } from '@ulixee/awaited-dom/base/interfaces/super';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import CoreCommandQueue from './CoreCommandQueue';
import CoreTab from './CoreTab';
export default class CoreFrameEnvironment {
    tabId: number;
    frameId: number;
    sessionId: string;
    commandQueue: CoreCommandQueue;
    parentFrameId: number;
    coreTab: CoreTab;
    constructor(coreTab: CoreTab, meta: ISessionMeta & {
        sessionName: string;
    }, parentFrameId?: number);
    getFrameMeta(): Promise<IFrameMeta>;
    getChildFrameEnvironment(jsPath: IJsPath): Promise<IFrameMeta>;
    execJsPath<T = any>(jsPath: IJsPath): Promise<IExecJsPathResult<T>>;
    getJsValue<T>(expression: string): Promise<T>;
    fetch(request: string | number, init?: IRequestInit): Promise<INodePointer>;
    createRequest(input: string | number, init?: IRequestInit): Promise<INodePointer>;
    detachElement(name: string, jsPath: IJsPath, waitForElement?: boolean, saveToDb?: boolean): Promise<IDetachedElement[]>;
    getUrl(): Promise<string>;
    isPaintingStable(): Promise<boolean>;
    isDomContentLoaded(): Promise<boolean>;
    isAllContentLoaded(): Promise<boolean>;
    interact(interactionGroups: IInteractionGroups): Promise<void>;
    getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility>;
    isFocused(element: IElementIsolate): Promise<boolean>;
    getNodePointer(node: INodeIsolate): Promise<INodePointer>;
    getCookies(): Promise<ICookie[]>;
    setCookie(name: string, value: string, options?: ISetCookieOptions): Promise<boolean>;
    removeCookie(name: string): Promise<boolean>;
    setFileInputFiles(jsPath: IJsPath, files: {
        name: string;
        data: Buffer;
    }[]): Promise<void>;
    waitForElement(element: ISuperElement, options: IWaitForElementOptions): Promise<ISuperElement>;
    waitForLoad(status: ILoadStatus, opts: IWaitForOptions): Promise<void>;
    waitForLocation(trigger: ILocationTrigger, opts: IWaitForOptions): Promise<IResourceMeta>;
}