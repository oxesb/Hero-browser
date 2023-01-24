import CommandTimeline from '@ulixee/hero-timetravel/lib/CommandTimeline';
import ICommandWithResult from '../interfaces/ICommandWithResult';
export default function sessionCommandsApi(args: ISessionCommandsArgs): ISessionCommandsResult;
export declare function loadCommandTimeline(args: ISessionCommandsArgs): CommandTimeline;
interface ISessionCommandsArgs {
    sessionId: string;
}
interface ISessionCommandsResult {
    commands: ICommandWithResult[];
}
export {};
