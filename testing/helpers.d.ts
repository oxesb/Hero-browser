/// <reference types="koa__router" />
/// <reference types="node" />
/// <reference types="koa__multer" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { URL } from 'url';
import * as http from 'http';
import { IncomingMessage, RequestListener } from 'http';
import * as https from 'https';
import { Agent } from 'https';
import * as Koa from 'koa';
import * as KoaRouter from '@koa/router';
import * as KoaMulter from '@koa/multer';
import * as net from 'net';
import * as http2 from 'http2';
import * as stream from 'stream';
import { Session, Tab } from '@ulixee/hero-core';
import MitmSocket from '@ulixee/unblocked-agent-mitm-socket';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IScriptInstanceMeta from '@ulixee/hero-interfaces/IScriptInstanceMeta';
import { IJsPath } from '@ulixee/js-path';
import FrameEnvironment from '@ulixee/hero-core/lib/FrameEnvironment';
export declare const needsClosing: {
    close: () => Promise<any> | void;
    onlyCloseOnFinal?: boolean;
}[];
export interface ITestKoaServer extends KoaRouter {
    close: () => void;
    server: http.Server;
    koa: Koa;
    isClosing?: boolean;
    onlyCloseOnFinal?: boolean;
    baseHost: string;
    baseUrl: string;
    upload: KoaMulter.Instance;
}
export interface ITestHttpServer<T> {
    isClosing: boolean;
    onlyCloseOnFinal: boolean;
    url: string;
    port: number;
    baseUrl: string;
    close: () => Promise<any>;
    on: (eventName: string, fn: (...args: any[]) => void) => any;
    server: T;
}
export declare function runKoaServer(onlyCloseOnFinal?: boolean): Promise<ITestKoaServer>;
export declare function sslCerts(): {
    key: Buffer;
    cert: Buffer;
};
export declare function runHttpsServer(handler: RequestListener, onlyCloseOnFinal?: boolean): Promise<ITestHttpServer<https.Server>>;
export declare function runHttpServer(params?: {
    onRequest?: (url: string, method: string, headers: http.IncomingHttpHeaders) => void;
    onPost?: (body: string) => void;
    addToResponse?: (response: http.ServerResponse) => void;
    onlyCloseOnFinal?: boolean;
}): Promise<ITestHttpServer<http.Server>>;
export declare function httpRequest(urlStr: string, method: string, proxyHost: string, proxyAuth?: string, headers?: {
    [name: string]: string;
}, response?: (res: IncomingMessage) => any, postData?: Buffer): Promise<string>;
export declare function getProxyAgent(url: URL, proxyHost: string, auth?: string): Agent;
export declare function httpGet(urlStr: string, proxyHost: string, proxyAuth?: string, headers?: {
    [name: string]: string;
}): Promise<string>;
export declare function http2Get(host: string, headers: {
    [':path']: string;
    [name: string]: string;
}, sessionId: string, proxyUrl?: string): Promise<string>;
export declare function runHttp2Server(handler: (request: http2.Http2ServerRequest, response: http2.Http2ServerResponse) => void): Promise<ITestHttpServer<http2.Http2SecureServer>>;
export declare function httpGetWithSocket(url: string, clientOptions: https.RequestOptions, socket: net.Socket): Promise<string>;
export declare function waitForElement(jsPath: IJsPath, frame: FrameEnvironment): Promise<void>;
export declare function getTlsConnection(serverPort: number, host?: string, isWebsocket?: boolean, proxyUrl?: string): MitmSocket;
export declare function getLogo(): Buffer;
export declare function readableToBuffer(res: stream.Readable): Promise<Buffer>;
export declare function afterEach(): Promise<void>;
export declare function afterAll(): Promise<void>;
export declare function onClose(closeFn: (() => Promise<any>) | (() => any), onlyCloseOnFinal?: boolean): void;
export declare function createScriptMeta(module: NodeModule, id: string): IScriptInstanceMeta;
export declare function createSession(options?: ISessionCreateOptions): Promise<{
    session: Session;
    tab: Tab;
}>;