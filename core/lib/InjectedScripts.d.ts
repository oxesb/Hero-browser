import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
export declare const heroIncludes: string;
export declare const CorePageInjectedScript: string;
export default class InjectedScripts {
    static Fetcher: string;
    static PageEventsCallbackName: string;
    static ShadowDomPiercerScript: string;
    static install(page: IPage, showInteractions?: boolean): Promise<any>;
    static installInteractionScript(page: IPage, isolatedFromWebPage?: boolean): Promise<{
        identifier: string;
    }>;
    static getIndexedDbStorageRestoreScript(): string;
}
