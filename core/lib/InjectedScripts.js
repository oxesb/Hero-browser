"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorePageInjectedScript = exports.heroIncludes = void 0;
const fs = require("fs");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const pageScripts = {
    domStorage: fs.readFileSync(`${__dirname}/../injected-scripts/domStorage.js`, 'utf8'),
    indexedDbRestore: fs.readFileSync(`${__dirname}/../injected-scripts/indexedDbRestore.js`, 'utf8'),
    interactReplayer: fs.readFileSync(`${__dirname}/../injected-scripts/interactReplayer.js`, 'utf8'),
    DomAssertions: fs.readFileSync(`${__dirname}/../injected-scripts/DomAssertions.js`, 'utf8'),
    Fetcher: fs.readFileSync(`${__dirname}/../injected-scripts/Fetcher.js`, 'utf8'),
    pageEventsRecorder: fs.readFileSync(`${__dirname}/../injected-scripts/pageEventsRecorder.js`, 'utf8'),
    shadowDomPiercer: fs.readFileSync(`${__dirname}/../injected-scripts/domOverride_openShadowRoots.js`, 'utf8'),
};
const pageEventsCallbackName = '__heroPageListenerCallback';
exports.heroIncludes = `
const exports = {}; // workaround for ts adding an exports variable

${pageScripts.Fetcher};
${pageScripts.DomAssertions};

window.HERO = {
  Fetcher,
  DomAssertions,
};
`;
const injectedScript = `(function installInjectedScripts() {
${exports.heroIncludes}

(function installDomRecorder(runtimeFunction) {
   ${pageScripts.pageEventsRecorder}
})('${pageEventsCallbackName}');

${pageScripts.domStorage}
})();`;
const showInteractionScript = `(function installInteractionsScript() {
const exports = {}; // workaround for ts adding an exports variable

window.selfFrameIdPath = '';
if (!('blockClickAndSubmit' in window)) window.blockClickAndSubmit = false;

if (!('getNodeById' in window)) {
  window.getNodeById = function getNodeById(id) {
    if (id === null || id === undefined) return null;
    return NodeTracker.getWatchedNodeWithId(id, false);
  };
}

${pageScripts.interactReplayer};
})();`;
const installedSymbol = Symbol('InjectedScripts.Installed');
exports.CorePageInjectedScript = exports.heroIncludes;
class InjectedScripts {
    static install(page, showInteractions = false) {
        if (page[installedSymbol])
            return;
        page[installedSymbol] = true;
        return Promise.all([
            page.addPageCallback(pageEventsCallbackName, null, true),
            page.addNewDocumentScript(injectedScript, true),
            showInteractions ? page.addNewDocumentScript(showInteractionScript, true) : null,
        ]);
    }
    static installInteractionScript(page, isolatedFromWebPage = true) {
        return page.addNewDocumentScript(showInteractionScript, isolatedFromWebPage);
    }
    static getIndexedDbStorageRestoreScript() {
        return `(function restoreIndexedDB() {
const exports = {}; // workaround for ts adding an exports variable
${TypeSerializer_1.stringifiedTypeSerializerClass};
${pageScripts.indexedDbRestore};
})();`;
    }
}
exports.default = InjectedScripts;
InjectedScripts.Fetcher = `HERO.Fetcher`;
InjectedScripts.PageEventsCallbackName = pageEventsCallbackName;
InjectedScripts.ShadowDomPiercerScript = pageScripts.shadowDomPiercer;
//# sourceMappingURL=InjectedScripts.js.map