/// <reference types="node" />
import IHttpHeaders from '@ulixee/unblocked-specification/agent/net/IHttpHeaders';
export default function sessionResourceApi(args: ISessionResourceArgs): ISessionResourceResult;
interface ISessionResourceArgs {
    sessionId: string;
    resourceId: number;
}
interface ISessionResourceResult {
    resource: ISessionResourceDetails;
}
export interface ISessionResourceDetails {
    body: Buffer;
    headers: IHttpHeaders;
    statusCode: number;
}
export {};
