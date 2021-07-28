import SessionDb, { ISessionFindArgs, ISessionFindResult } from '../dbs/SessionDb';
import ICoreApi from '../interfaces/ICoreApi';
import { GlobalPool } from '../index';

export default function sessionFindApi(lookup: ISessionFindArgs): ISessionFindResult {
  lookup.dataLocation ??= GlobalPool.sessionsDir;
  const sessionLookup = SessionDb.find(lookup);

  if (!sessionLookup) {
    throw new Error(
      `No sessions found with the given lookup parameters (${JSON.stringify(
        lookup,
        (key, value) => value,
        2,
      )})`,
    );
  }

  return sessionLookup;
}

export interface ISessionFindApi extends ICoreApi {
  args: ISessionFindArgs;
  result: ISessionFindResult;
}
