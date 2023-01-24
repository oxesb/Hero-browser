export default function sessionTabsApi(args: ISessionTabsArgs): ISessionTabsResult;
interface ISessionTabsArgs {
    sessionId: string;
}
interface ISessionTabsResult {
    tabs: ISessionTab[];
}
export interface ISessionTab {
    id: number;
    createdTime: number;
    startUrl: string;
    width: number;
    height: number;
    frames: ISessionFrame[];
}
export interface ISessionFrame {
    id: number;
    isMainFrame: boolean;
    domNodePath: string;
}
export {};
