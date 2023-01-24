"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _HeroReplay_hero;
Object.defineProperty(exports, "__esModule", { value: true });
const Hero_1 = require("./Hero");
class HeroReplay {
    constructor(initializeOptions) {
        _HeroReplay_hero.set(this, void 0);
        if ('hero' in initializeOptions) {
            __classPrivateFieldSet(this, _HeroReplay_hero, initializeOptions.hero, "f");
        }
        else {
            __classPrivateFieldSet(this, _HeroReplay_hero, new Hero_1.default(initializeOptions), "f");
        }
    }
    get detachedElements() {
        return __classPrivateFieldGet(this, _HeroReplay_hero, "f").detachedElements;
    }
    get detachedResources() {
        return __classPrivateFieldGet(this, _HeroReplay_hero, "f").detachedResources;
    }
    getSnippet(key) {
        return __classPrivateFieldGet(this, _HeroReplay_hero, "f").getSnippet(key);
    }
    get sessionId() {
        return __classPrivateFieldGet(this, _HeroReplay_hero, "f").sessionId;
    }
    close() {
        return __classPrivateFieldGet(this, _HeroReplay_hero, "f").close();
    }
}
exports.default = HeroReplay;
_HeroReplay_hero = new WeakMap();
//# sourceMappingURL=HeroReplay.js.map