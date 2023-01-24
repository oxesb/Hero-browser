"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nanoid_1 = require("nanoid");
const utils_1 = require("@ulixee/commons/lib/utils");
const AwaitedDomPath = require.resolve('@ulixee/awaited-dom/package.json').replace('package.json', '');
const HeroLibPath = require.resolve('./Hero').replace(/\/Hero\.(?:ts|js)/, '');
class ScriptInstance {
    constructor() {
        this.ignoreModulePaths = ['node:internal', AwaitedDomPath, HeroLibPath];
        this.id = (0, nanoid_1.nanoid)();
        this.entrypoint = require.main?.filename ?? process.argv[1];
        this.startDate = Date.now();
        this.sessionNameCountByName = {};
        this.mode = process.env.NODE_ENV;
        if (!['development', 'production', 'multiverse', 'timetravel', 'browserless'].includes(this.mode)) {
            this.mode = 'development';
        }
    }
    get meta() {
        return {
            id: this.id,
            workingDirectory: process.cwd(),
            entrypoint: this.entrypoint,
            startDate: this.startDate,
            execPath: process.execPath,
            execArgv: process.execArgv,
        };
    }
    generateSessionName(name, shouldCleanName = true) {
        if (name && shouldCleanName) {
            name = cleanupSessionName(name);
        }
        name = name || 'default-session';
        this.sessionNameCountByName[name] = this.sessionNameCountByName[name] || 0;
        const countPlusOne = this.sessionNameCountByName[name] + 1;
        if (countPlusOne > 1) {
            const newName = `${name}-${countPlusOne}`;
            if (this.sessionNameCountByName[newName]) {
                return this.generateSessionName(newName, false);
            }
            this.sessionNameCountByName[name] += 1;
            return newName;
        }
        this.sessionNameCountByName[name] += 1;
        return name;
    }
    getScriptCallsite() {
        const stack = (0, utils_1.getCallSite)(module.filename);
        let stackLines = [];
        let lastIndexOfEntrypoint = -1;
        for (const callsite of stack) {
            const { filename } = callsite;
            if (!filename)
                continue;
            if (this.ignoreModulePaths.find(x => filename.startsWith(x))) {
                continue;
            }
            if (filename.endsWith(this.entrypoint)) {
                lastIndexOfEntrypoint = stackLines.length;
            }
            stackLines.push(callsite);
        }
        if (lastIndexOfEntrypoint >= 0)
            stackLines = stackLines.slice(0, lastIndexOfEntrypoint + 1);
        return stackLines;
    }
}
exports.default = ScriptInstance;
function cleanupSessionName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9-]+/gi, '-')
        .replace(/--/g, '')
        .replace(/^-|-$/g, '');
}
//# sourceMappingURL=ScriptInstance.js.map