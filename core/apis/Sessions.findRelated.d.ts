import { ISessionsFindRelatedResult } from '../dbs/SessionsDb';
export default function sessionsFindRelatedApi(args: ISessionsFindRelatedArgs): ISessionsFindRelatedResult;
interface ISessionsFindRelatedArgs {
    sessionId: string;
}
export {};
