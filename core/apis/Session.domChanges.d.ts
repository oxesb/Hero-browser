import { IDomChangeRecord } from '../models/DomChangesTable';
export default function sessionDomChangesApi(args: ISessionDomChangesArgs): ISessionDomChangesResult;
interface ISessionDomChangesArgs {
    sessionId: string;
}
interface ISessionDomChangesResult {
    domChangesByTabId: {
        [tabId: number]: IDomChangeRecord[];
    };
}
export {};
