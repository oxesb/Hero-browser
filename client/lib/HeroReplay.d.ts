import IHeroReplayCreateOptions from '../interfaces/IHeroReplayCreateOptions';
import DetachedElements from './DetachedElements';
import DetachedResources from './DetachedResources';
export default class HeroReplay {
    #private;
    constructor(initializeOptions: IHeroReplayCreateOptions);
    get detachedElements(): DetachedElements;
    get detachedResources(): DetachedResources;
    getSnippet<T = any>(key: string): Promise<T>;
    get sessionId(): Promise<string>;
    close(): Promise<void>;
}
