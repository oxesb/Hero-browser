import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';
export default function sessionResourcesApi(args: ISessionResourcesArgs): ISessionResourcesResult;
interface ISessionResourcesArgs {
    sessionId: string;
    omitWithoutResponse?: boolean;
    omitNonHttpGet?: boolean;
}
interface ISessionResourcesResult {
    resources: IResourceSummary[];
}
export {};
