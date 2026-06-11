import { IGunConstructorOptions } from './gun/types/options';
import { isPlatformWeb } from './support';

function getEnvPeers(): string {
    if (typeof process !== 'undefined' && process.env) {
        return process.env.TEST_GUN_PEERS || '';
    }
    return '';
}

export const TEST_GUN_PEERS: string[] = isPlatformWeb()
    ? []
    : getEnvPeers()
        .split(',')
        .map(peer => peer.trim())
        .filter(peer => !!peer);

export const TEST_GUN_OPTIONS: IGunConstructorOptions = {
    peers: TEST_GUN_PEERS,
    radisk: false,
    localStorage: false,
    axe: false,
    multicast: false,
};
