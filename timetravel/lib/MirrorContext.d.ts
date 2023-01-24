import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
export default class MirrorContext {
    static createFromSessionDb(sessionId: string, headed?: boolean): Promise<BrowserContext>;
}
