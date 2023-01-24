"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SourceLoader_1 = require("@ulixee/commons/lib/SourceLoader");
const Queue_1 = require("@ulixee/commons/lib/Queue");
const DisconnectedError_1 = require("@ulixee/net/errors/DisconnectedError");
const SetupAwaitedHandler_1 = require("./SetupAwaitedHandler");
const internal_1 = require("./internal");
class CoreCommandQueue {
    constructor(meta, mode, connection, commandCounter, internalState) {
        this.sessionMarker = '';
        this.flushes = [];
        this.connection = connection;
        this.mode = mode;
        if (meta) {
            const markers = [
                ''.padEnd(50, '-'),
                `------${meta.sessionName ?? ''}`.padEnd(50, '-'),
                `------${meta.sessionId ?? ''}`.padEnd(50, '-'),
                ''.padEnd(50, '-'),
            ].join('\n');
            this.sessionMarker = `\n\n${markers}`;
            this.meta = { sessionId: meta.sessionId, tabId: meta.tabId, frameId: meta.frameId };
        }
        this.commandCounter = commandCounter;
        this.internalState = internalState ?? {
            queue: new Queue_1.default('CORE COMMANDS', 1),
            commandsToRecord: [],
            commandRetryHandlerFns: [],
            isCheckingForRetry: false,
            shouldRetryCommands: true,
        };
    }
    get lastCommandId() {
        return this.commandCounter?.lastCommandId;
    }
    get lastCommand() {
        return this.internalState.lastCommand;
    }
    get commandMetadata() {
        return this.internalState.commandMetadata;
    }
    get retryingCommand() {
        return this.internalState.retryingCommand;
    }
    set retryingCommand(commandMeta) {
        this.internalState.retryingCommand = commandMeta;
    }
    get nextCommandId() {
        return this.commandCounter?.nextCommandId;
    }
    get shouldRetryCommands() {
        return this.internalState.shouldRetryCommands;
    }
    set shouldRetryCommands(shouldRetry) {
        this.internalState.shouldRetryCommands = shouldRetry;
    }
    get internalQueue() {
        return this.internalState.queue;
    }
    setCommandMetadata(metadata) {
        var _a;
        (_a = this.internalState).commandMetadata ?? (_a.commandMetadata = {});
        Object.assign(this.internalState.commandMetadata, metadata);
    }
    registerCommandRetryHandlerFn(handlerFn) {
        this.internalState.commandRetryHandlerFns.push(handlerFn);
    }
    async intercept(interceptCommandFn, runCommandsToInterceptFn) {
        var _a;
        (_a = this.internalState).interceptQueue ?? (_a.interceptQueue = new Queue_1.default());
        return await this.internalState.interceptQueue.run(async () => {
            this.internalState.interceptFn = interceptCommandFn;
            try {
                return await runCommandsToInterceptFn();
            }
            finally {
                this.internalState.interceptFn = undefined;
            }
        });
    }
    record(command) {
        this.internalState.commandsToRecord.push({
            ...command,
            startTime: Date.now(),
        });
        if (this.internalState.commandsToRecord.length > 1000) {
            this.flush().catch(() => null);
        }
        else if (!this.flushOnTimeout) {
            this.flushOnTimeout = setTimeout(() => this.flush(), 1e3).unref();
        }
    }
    async flush() {
        clearTimeout(this.flushOnTimeout);
        this.flushOnTimeout = null;
        if (!this.internalState.commandsToRecord.length)
            return;
        const recordCommands = [...this.internalState.commandsToRecord];
        this.internalState.commandsToRecord.length = 0;
        const flush = this.connection.sendRequest({
            meta: this.meta,
            command: 'Session.flush',
            commandId: this.nextCommandId,
            startTime: Date.now(),
            args: [],
            recordCommands,
        });
        this.flushes.push(flush);
        // wait for all pending flushes
        await Promise.all(this.flushes);
        const idx = this.flushes.indexOf(flush);
        if (idx >= 0)
            this.flushes.splice(idx, 1);
    }
    async runOutOfBand(command, ...args) {
        const commandId = this.nextCommandId;
        this.commandCounter?.emitter.emit('command', command, commandId, args);
        return await this.sendRequest({
            command,
            args,
            commandId,
            startTime: Date.now(),
            callsite: internal_1.scriptInstance.getScriptCallsite(),
            ...(this.internalState.commandMetadata ?? {}),
        });
    }
    run(command, ...args) {
        clearTimeout(this.flushOnTimeout);
        this.flushOnTimeout = null;
        if (this.connection.disconnectPromise) {
            throw new DisconnectedError_1.default(this.connection.transport.host);
        }
        for (const arg of args) {
            if (Array.isArray(arg)) {
                (0, SetupAwaitedHandler_1.convertJsPathArgs)(arg);
            }
        }
        if (this.internalState.interceptFn) {
            const result = this.internalState.interceptFn(this.meta, command, ...args);
            if (result && result instanceof Error) {
                result.stack += `${this.sessionMarker}`;
                throw result;
            }
            return Promise.resolve(result);
        }
        const callsite = internal_1.scriptInstance.getScriptCallsite();
        const commandId = this.nextCommandId;
        const commandPayload = {
            command,
            args,
            startTime: Date.now(),
            commandId,
            callsite,
            ...(this.internalState.commandMetadata ?? {}),
        };
        return this.internalQueue
            .run(async () => {
            const recordCommands = [...this.internalState.commandsToRecord];
            this.internalState.commandsToRecord.length = 0;
            this.internalState.lastCommand = {
                meta: this.meta,
                ...commandPayload,
            };
            this.commandCounter?.emitter.emit('command', command, commandId, args);
            return await this.sendRequest({
                ...commandPayload,
                recordCommands,
            });
        })
            .catch(error => {
            if (error instanceof DisconnectedError_1.default)
                throw error;
            this.internalState.retryingCommand = commandPayload;
            return this.tryRetryCommand(error);
        })
            .catch(error => {
            if (!error.stack.includes(this.sessionMarker)) {
                error.stack += `${this.sessionMarker}`;
            }
            if (callsite?.length) {
                const lastLine = callsite[0];
                if (lastLine) {
                    try {
                        const code = SourceLoader_1.default.getSource(lastLine)?.code?.trim();
                        if (code && !error.stack.includes(code)) {
                            error.stack = `\n\n  --->  ${code}\n\n\n${error.stack}`;
                        }
                    }
                    catch (_) {
                        // drown if we can't read the source code
                    }
                }
            }
            throw error;
        });
    }
    willStop() {
        this.internalQueue.willStop();
    }
    stop(cancelError) {
        clearTimeout(this.flushOnTimeout);
        this.internalQueue.stop(cancelError);
    }
    createSharedQueue(meta) {
        return new CoreCommandQueue(meta, this.mode, this.connection, this.commandCounter, this.internalState);
    }
    async sendRequest(payload) {
        if (this.connection.disconnectPromise) {
            return Promise.resolve(null);
        }
        return await this.connection.sendRequest({
            meta: this.meta,
            ...payload,
        });
    }
    async tryRetryCommand(error) {
        // don't retry within an existing "retry" run
        if (this.internalState.isCheckingForRetry || !this.shouldRetryCommands)
            throw error;
        // perform retries out of the "queue" so we don't get stuck
        let lastError = error;
        for (let retryNumber = 1; retryNumber < CoreCommandQueue.maxCommandRetries; retryNumber += 1) {
            const shouldRetry = await this.shouldRetryCommand(this.internalState.retryingCommand, lastError);
            if (!shouldRetry)
                break;
            try {
                return await this.sendRequest({
                    ...this.internalState.retryingCommand,
                    retryNumber,
                });
            }
            catch (nestedError) {
                lastError = nestedError;
            }
        }
        throw lastError;
    }
    async shouldRetryCommand(command, error) {
        for (const handler of this.internalState.commandRetryHandlerFns) {
            this.internalState.isCheckingForRetry = true;
            try {
                if (await handler(command, error)) {
                    return true;
                }
            }
            finally {
                this.internalState.isCheckingForRetry = false;
            }
        }
        return false;
    }
}
exports.default = CoreCommandQueue;
CoreCommandQueue.maxCommandRetries = 3;
//# sourceMappingURL=CoreCommandQueue.js.map