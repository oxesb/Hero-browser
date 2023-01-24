import { IMouseEventRecord, MouseEventType } from '../models/MouseEventsTable';
import { IFocusRecord } from '../models/FocusEventsTable';
import { IScrollRecord } from '../models/ScrollEventsTable';
export default function sessionInteractionsApi(args: ISessionInteractionsArgs): ISessionInteractionsResult;
interface ISessionInteractionsArgs {
    sessionId: string;
    mouseEventsFilter?: MouseEventType[];
}
export interface ISessionInteractionsResult {
    mouse: IMouseEventRecord[];
    focus: IFocusRecord[];
    scroll: IScrollRecord[];
}
export {};
