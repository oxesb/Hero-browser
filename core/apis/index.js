"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.heroApiHandlers = void 0;
const Session_commands_1 = require("./Session.commands");
const Session_domChanges_1 = require("./Session.domChanges");
const Session_interactions_1 = require("./Session.interactions");
const Session_resource_1 = require("./Session.resource");
const Session_resources_1 = require("./Session.resources");
const Session_tabs_1 = require("./Session.tabs");
const Session_ticks_1 = require("./Session.ticks");
const Session_find_1 = require("./Session.find");
const Sessions_findRelated_1 = require("./Sessions.findRelated");
const Sessions_findWithErrors_1 = require("./Sessions.findWithErrors");
const Sessions_search_1 = require("./Sessions.search");
const heroApiHandlers = {
    'Session.commands': Session_commands_1.default,
    'Session.domChanges': Session_domChanges_1.default,
    'Session.interactions': Session_interactions_1.default,
    'Session.find': Session_find_1.default,
    'Session.resource': Session_resource_1.default,
    'Session.resources': Session_resources_1.default,
    'Session.tabs': Session_tabs_1.default,
    'Session.ticks': Session_ticks_1.default,
    'Sessions.findRelated': Sessions_findRelated_1.default,
    'Sessions.findWithErrors': Sessions_findWithErrors_1.default,
    'Sessions.search': Sessions_search_1.default,
};
exports.heroApiHandlers = heroApiHandlers;
//# sourceMappingURL=index.js.map