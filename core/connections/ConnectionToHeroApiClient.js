"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("@ulixee/net");
const TransportBridge_1 = require("@ulixee/net/lib/TransportBridge");
const apis_1 = require("../apis");
class ConnectionToHeroApiClient extends net_1.ConnectionToClient {
    constructor(transport) {
        super(transport, apis_1.heroApiHandlers);
    }
    static createBridge() {
        const bridge = new TransportBridge_1.default();
        new ConnectionToHeroApiClient(bridge.transportToClient);
        return bridge;
    }
}
exports.default = ConnectionToHeroApiClient;
//# sourceMappingURL=ConnectionToHeroApiClient.js.map