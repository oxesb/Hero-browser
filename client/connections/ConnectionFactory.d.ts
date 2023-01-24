import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import ConnectionToHeroCore from './ConnectionToHeroCore';
export default class ConnectionFactory {
    static hasLocalMinerPackage: boolean;
    static createConnection(options: IConnectionToCoreOptions | ConnectionToHeroCore): ConnectionToHeroCore;
}
