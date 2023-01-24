import { ISuperElement, ISuperHTMLElement, ISuperNode } from '@ulixee/awaited-dom/base/interfaces/super';
export default interface IDomState {
    url?: string | RegExp;
    all: IDomStateAllFn;
}
declare type IAwaitedNode = ISuperNode | ISuperElement | ISuperHTMLElement;
declare type DomNodeOrPromiseValue<T> = T extends PromiseLike<infer R> ? R : T extends IAwaitedNode ? T : never;
export declare type IDomStateAllFn = (options: IDomStateAssertions) => void;
export declare type IStateAndAssertion<T> = [
    statePromise: T,
    assertionFnOrValue?: ((state: DomNodeOrPromiseValue<T>) => boolean) | DomNodeOrPromiseValue<T>
];
export declare type IDomStateAssertions = <T>(statePromise: T, assertionFnOrValue?: ((state: DomNodeOrPromiseValue<T>) => boolean) | DomNodeOrPromiseValue<T>) => void;
export {};
