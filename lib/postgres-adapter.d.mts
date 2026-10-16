export type DatabaseResult<T=Record<string,unknown>>={results:T[];success:boolean;meta:{changes:number}};
export interface PreparedStatement {
  bind(...values:unknown[]):PreparedStatement;
  first<T=Record<string,unknown>>():Promise<T|null>;
  first<T=unknown>(column:string):Promise<T|null>;
  all<T=Record<string,unknown>>():Promise<DatabaseResult<T>>;
  run<T=Record<string,unknown>>():Promise<DatabaseResult<T>>;
}
export interface PostgresDatabase {
  prepare(sql:string):PreparedStatement;
  batch<T=Record<string,unknown>>(statements:PreparedStatement[]):Promise<DatabaseResult<T>[]>;
}
export function translatePostgresSql(source:string,values?:unknown[]):{text:string;parameters:number};
export function createPostgresDatabase(sql:{query:Function;transaction:Function}):PostgresDatabase;
