"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionDb_1 = require("../dbs/SessionDb");
const MouseEventsTable_1 = require("../models/MouseEventsTable");
function sessionInteractionsApi(args) {
    const sessionDb = SessionDb_1.default.getCached(args.sessionId, true);
    function sort(a, b) {
        return a.timestamp - b.timestamp;
    }
    const validMouseEvents = args.mouseEventsFilter ?? [
        MouseEventsTable_1.MouseEventType.MOVE,
        MouseEventsTable_1.MouseEventType.DOWN,
        MouseEventsTable_1.MouseEventType.UP,
    ];
    const filteredMouseEvents = new Set(validMouseEvents);
    function filterMouse(mouse) {
        return filteredMouseEvents.has(mouse.event);
    }
    return {
        mouse: sessionDb.mouseEvents.all().filter(filterMouse).sort(sort),
        focus: sessionDb.focusEvents.all().sort(sort),
        scroll: sessionDb.scrollEvents.all().sort(sort),
    };
}
exports.default = sessionInteractionsApi;
//# sourceMappingURL=Session.interactions.js.map