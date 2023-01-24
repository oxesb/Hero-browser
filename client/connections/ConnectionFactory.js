"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const hosts_1 = require("@ulixee/commons/config/hosts");
const net_1 = require("@ulixee/net");
const ConnectionToHeroCore_1 = require("./ConnectionToHeroCore");
const { version } = require('../package.json');
const { log } = (0, Logger_1.default)(module);
class ConnectionFactory {
    static createConnection(options) {
        if (options instanceof ConnectionToHeroCore_1.default) {
            // NOTE: don't run connect on an instance
            return options;
        }
        let connection;
        if (options.host) {
            const host = Promise.resolve(options.host).then(ConnectionToHeroCore_1.default.resolveHost);
            const transport = new net_1.WsTransportToCore(host);
            connection = new ConnectionToHeroCore_1.default(transport);
        }
        else {
            const host = hosts_1.default.global.getVersionHost(version);
            if (!host && ConnectionFactory.hasLocalMinerPackage) {
                // If Miners are launched, but none compatible, propose installing Miner locally
                throw new Error(`Your Ulixee Miner is not started. From your project, run:\n\nnpx @ulixee/miner start`);
            }
            if (host) {
                const transport = new net_1.WsTransportToCore(ConnectionToHeroCore_1.default.resolveHost(host));
                connection = new ConnectionToHeroCore_1.default(transport, { ...options, version });
            }
            else if (hosts_1.default.global.hasHosts()) {
                // If Miners are launched, but none compatible, propose installing miner locally
                throw new Error(`Your script is using version ${version} of Hero. A compatible Hero Core was not found on localhost. You can fix this by installing and running a Ulixee Miner in your project:

npm install --save-dev @ulixee/miner @ulixee/apps-chromealive-core

npx @ulixee/miner start
        `);
            }
        }
        if (!connection) {
            throw new Error('Hero Core could not be found locally' +
                '\n' +
                'If you meant to connect to a remote host, include the "host" parameter for your connection');
        }
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        const onError = (error) => {
            if (error) {
                log.error('Error connecting to core', {
                    error,
                    sessionId: null,
                });
            }
        };
        connection.connect(true).then(onError).catch(onError);
        ShutdownHandler_1.default.register(() => connection.disconnect());
        return connection;
    }
}
exports.default = ConnectionFactory;
ConnectionFactory.hasLocalMinerPackage = false;
try {
    require.resolve('@ulixee/miner');
    ConnectionFactory.hasLocalMinerPackage = true;
}
catch (error) {
    /* no-op */
}
//# sourceMappingURL=ConnectionFactory.js.map