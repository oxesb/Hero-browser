"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionDb_1 = require("../dbs/SessionDb");
function sessionTabsApi(args) {
    const sessionDb = SessionDb_1.default.getCached(args.sessionId, true);
    const tabs = sessionDb.tabs.all();
    const frames = sessionDb.frames.all();
    // don't take redirects
    const frameNavigations = sessionDb.frameNavigations.all().filter(x => !x.httpRedirectedTime);
    const result = {
        tabs: [],
    };
    for (const tab of tabs) {
        const tabFrames = frames.filter(x => x.tabId === tab.id);
        const mainFrame = frames.find(x => !x.parentId && x.tabId === tab.id);
        const startNavigation = frameNavigations.find(x => x.frameId === mainFrame.id);
        result.tabs.push({
            id: tab.id,
            width: tab.viewportWidth,
            height: tab.viewportHeight,
            startUrl: startNavigation.finalUrl ?? startNavigation.requestedUrl,
            createdTime: tab.createdTime,
            frames: tabFrames.map(x => {
                return {
                    id: x.id,
                    isMainFrame: !x.parentId,
                    domNodePath: sessionDb.frames.frameDomNodePathsById[x.id],
                };
            }),
        });
    }
    return result;
}
exports.default = sessionTabsApi;
//# sourceMappingURL=Session.tabs.js.map