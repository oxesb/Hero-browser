export default function sessionsFindWithErrorsApi(): ISessionsFindWithErrorsResult;
interface ISessionsFindWithErrorsResult {
    sessions: {
        id: string;
        name: string;
        start: Date;
        end: Date;
        logErrors: {
            date: Date;
            action: string;
            path: string;
            error: string;
        }[];
        commandsWithErrors: {
            wasCanceled: boolean;
            didTimeout: boolean;
            isLastCommand: boolean;
            label: string;
            date: Date;
        }[];
    }[];
}
export {};
