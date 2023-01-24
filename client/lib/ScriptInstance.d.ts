import IScriptInstanceMeta from '@ulixee/hero-interfaces/IScriptInstanceMeta';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
export default class ScriptInstance {
    readonly ignoreModulePaths: string[];
    readonly id: string;
    readonly entrypoint: string;
    readonly startDate: number;
    readonly mode: ISessionCreateOptions['mode'];
    private sessionNameCountByName;
    constructor();
    get meta(): IScriptInstanceMeta;
    generateSessionName(name: string, shouldCleanName?: boolean): string;
    getScriptCallsite(): ISourceCodeLocation[];
}
