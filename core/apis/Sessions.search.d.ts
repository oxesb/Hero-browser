export default function sessionsSearchApi(args: ISessionsSearchArgs): ISessionsSearchResult;
interface ISessionsSearchArgs {
    commandArg?: string;
    devtoolsKey?: string;
}
interface ISessionsSearchResult {
    sessions: {
        id: string;
        name: string;
        start: Date;
        end: Date;
        commands: string[];
        didMatchDevtools: boolean;
        didMatchCommands: boolean;
    }[];
}
export {};
