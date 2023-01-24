"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IDomChangeEvent_1 = require("@ulixee/hero-interfaces/IDomChangeEvent");
const DomChangesTable_1 = require("../models/DomChangesTable");
const Session_commands_1 = require("./Session.commands");
const Session_domChanges_1 = require("./Session.domChanges");
const Session_interactions_1 = require("./Session.interactions");
const SessionDb_1 = require("../dbs/SessionDb");
const Session_tabs_1 = require("./Session.tabs");
const CommandFormatter_1 = require("../lib/CommandFormatter");
function sessionTicksApi(args) {
    const sessionDb = SessionDb_1.default.getCached(args.sessionId, true);
    const session = sessionDb.session.get();
    const timeline = (0, Session_commands_1.loadCommandTimeline)(args);
    const commands = timeline.commands.map(CommandFormatter_1.default.parseResult);
    const { domChangesByTabId } = (0, Session_domChanges_1.default)(args);
    const interactions = (0, Session_interactions_1.default)(args);
    const { tabs } = (0, Session_tabs_1.default)(args);
    const state = createSessionState(session, tabs, timeline);
    createCommandTicks(state, commands);
    createInteractionTicks(state, interactions);
    createPaintTicks(state, domChangesByTabId);
    // now sort all ticks and assign events
    sortTicks(state);
    const tabDetails = Object.values(state.tabsById);
    for (const tab of tabDetails) {
        if (!args.includeInteractionEvents) {
            delete tab.scroll;
            delete tab.focus;
            delete tab.mouse;
        }
        if (!args.includeCommands) {
            delete tab.commands;
        }
        if (!args.includePaintEvents) {
            delete tab.paintEvents;
        }
    }
    return { tabDetails };
}
exports.default = sessionTicksApi;
/////// HELPER FUNCTIONS  //////////////////////////////////////////////////////////////////////////////////////////////
function createSessionState(session, tabs, timeline) {
    const state = {
        tabsById: {},
        timeline,
    };
    for (const tab of tabs) {
        state.tabsById[tab.id] = {
            tab,
            ticks: [],
            documents: [],
            mouse: [],
            focus: [],
            scroll: [],
            commands: [],
            paintEvents: [],
        };
    }
    return state;
}
function createCommandTicks(state, commands) {
    for (let i = 0; i < commands.length; i += 1) {
        const command = commands[i];
        const tabId = command.tabId ?? Number(Object.keys(state.tabsById)[0]);
        addTick(state, 'command', i, {
            timestamp: command.startTime,
            commandId: command.id,
            label: command.label,
            tabId,
        });
        const tabDetails = state.tabsById[tabId];
        tabDetails.commands.push(command);
    }
}
function createInteractionTicks(state, interactions) {
    for (const type of ['mouse', 'focus', 'scroll']) {
        const events = interactions[type];
        for (let i = 0; i < events.length; i += 1) {
            const event = events[i];
            addTick(state, type, i, event);
            const { tabId } = event;
            const tabEvents = state.tabsById[tabId][type];
            tabEvents.push(event);
        }
    }
}
function createPaintTicks(state, domChangesByTabId) {
    for (const [tabId, changes] of Object.entries(domChangesByTabId)) {
        const details = state.tabsById[tabId];
        const { documents, tab } = details;
        const mainFrameIds = new Set(tab.frames.filter(x => x.isMainFrame).map(x => x.id));
        const toPaint = DomChangesTable_1.default.toDomRecording(changes, mainFrameIds);
        documents.push(...toPaint.documents);
        let idx = 0;
        for (const event of toPaint.paintEvents) {
            const tick = addTick(state, 'paint', idx, { tabId: Number(tabId), ...event });
            const { action, frameId, textContent } = event.changeEvents[0];
            details.paintEvents.push(event);
            const isMainframe = mainFrameIds.has(frameId);
            if (isMainframe && action === IDomChangeEvent_1.DomActionType.newDocument) {
                tick.isNewDocumentTick = true;
                tick.documentUrl = textContent;
            }
            idx += 1;
        }
    }
}
function sortTicks(state) {
    for (const tabDetails of Object.values(state.tabsById)) {
        const { focus, mouse, commands, tab } = tabDetails;
        const firstDocument = tabDetails.documents[0];
        let lastEvents = {
            documentLoadPaintIndex: firstDocument.paintEventIndex,
            documentUrl: firstDocument.url,
        };
        const commandHighlightsById = new Map();
        for (const command of commands) {
            if (command.resultNodeIds) {
                commandHighlightsById.set(command.id, command);
            }
        }
        tabDetails.ticks.sort((a, b) => {
            if (a.timestamp === b.timestamp) {
                if (a.eventType === b.eventType)
                    return a.eventTypeIndex - b.eventTypeIndex;
                return a.eventType.localeCompare(b.eventType);
            }
            return a.timestamp - b.timestamp;
        });
        for (const tick of tabDetails.ticks) {
            // if new doc, reset the markers
            if (tick.isNewDocumentTick) {
                lastEvents = {
                    paintEventIndex: tick.eventTypeIndex,
                    scrollEventIndex: undefined,
                    mouseEventIndex: undefined,
                    focusEventIndex: undefined,
                    documentLoadPaintIndex: tick.eventTypeIndex,
                    documentUrl: tick.documentUrl,
                    highlightNodeIds: undefined,
                };
            }
            switch (tick.eventType) {
                case 'command':
                    const command = commandHighlightsById.get(tick.commandId);
                    if (command) {
                        lastEvents.highlightNodeIds = {
                            nodeIds: command.resultNodeIds,
                            frameId: command.frameId,
                        };
                    }
                    break;
                case 'focus':
                    lastEvents.focusEventIndex = tick.eventTypeIndex;
                    const focusEvent = focus[tick.eventTypeIndex];
                    if (focusEvent.event === 0 && focusEvent.targetNodeId) {
                        lastEvents.highlightNodeIds = {
                            nodeIds: [focusEvent.targetNodeId],
                            frameId: focusEvent.frameId,
                        };
                    }
                    else if (focusEvent.event === 1) {
                        lastEvents.highlightNodeIds = undefined;
                    }
                    break;
                case 'paint':
                    lastEvents.paintEventIndex = tick.eventTypeIndex;
                    break;
                case 'scroll':
                    lastEvents.scrollEventIndex = tick.eventTypeIndex;
                    break;
                case 'mouse':
                    lastEvents.mouseEventIndex = tick.eventTypeIndex;
                    const mouseEvent = mouse[tick.eventTypeIndex];
                    if (mouseEvent.event === 1 && mouseEvent.targetNodeId) {
                        lastEvents.highlightNodeIds = {
                            nodeIds: [mouseEvent.targetNodeId],
                            frameId: mouseEvent.frameId,
                        };
                    }
                    else if (mouseEvent.event === 2) {
                        lastEvents.highlightNodeIds = undefined;
                    }
                    break;
            }
            Object.assign(tick, lastEvents);
            if (tick.eventType === 'init' || lastEvents.paintEventIndex === undefined) {
                tick.documentLoadPaintIndex = -1;
                tick.documentUrl = tab.startUrl;
                tick.paintEventIndex = -1;
            }
        }
        // filter afterwards so we get correct navigations
        tabDetails.ticks = tabDetails.ticks.filter(tick => {
            tick.timelineOffsetPercent ?? (tick.timelineOffsetPercent = state.timeline.getTimelineOffsetForTimestamp(tick.timestamp));
            return tick.timelineOffsetPercent <= 100 && tick.timelineOffsetPercent >= 0;
        });
    }
}
function addTick(state, eventType, eventTypeIndex, tick) {
    const { commandId, timestamp, label, tabId } = tick;
    const newTick = {
        eventType,
        eventTypeIndex,
        commandId,
        timestamp,
        label,
        isMajor: eventType === 'command',
    };
    const tabDetails = tabId ? state.tabsById[tabId] : Object.values(state.tabsById)[0];
    tabDetails.ticks.push(newTick);
    return newTick;
}
//# sourceMappingURL=Session.ticks.js.map