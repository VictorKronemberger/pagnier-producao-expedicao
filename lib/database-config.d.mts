import type {Config} from '@libsql/client';
export function databaseProvider(env:Record<string,string|undefined>):'turso'|'neon';
export function tursoConfig(env:Record<string,string|undefined>):Config;
