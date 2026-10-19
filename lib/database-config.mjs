export function databaseProvider(env){
 const provider=env.DATABASE_PROVIDER?.trim()||'neon';
 if(!['turso','neon'].includes(provider))throw Error('DATABASE_PROVIDER must be turso or neon.');
 return provider;
}
export function tursoConfig(env){
 if(!env.TURSO_DATABASE_URL||!env.TURSO_AUTH_TOKEN)throw Error('Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
 const url=new URL(env.TURSO_DATABASE_URL);
 if(!['libsql:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('Use the secure database URL supplied by Turso.');
 return {url:env.TURSO_DATABASE_URL,authToken:env.TURSO_AUTH_TOKEN,intMode:'bigint'};
}
