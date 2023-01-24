export declare type IExtractElementFn<T> = (element: Element) => T | Promise<T>;
export declare type IExtractElementsFn<T> = (elements: Element[]) => T | Promise<T>;
export interface IExtractElementOptions {
    name?: string;
}
