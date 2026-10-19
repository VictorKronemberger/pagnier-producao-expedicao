// D1-compatible boundary. SQL stays parameterized and batches are atomic writes.
export function normalizeTursoResult(result){
 const results=result.rows.map(row=>Object.fromEntries(result.columns.map(column=>{
  const value=row[column];
  if(typeof value==='bigint'){
   const number=Number(value);if(!Number.isSafeInteger(number))throw new RangeError('Database integer exceeds JavaScript safe range.');
   return [column,number];
  }
  if(typeof value==='number'&&(!Number.isFinite(value)||(Number.isInteger(value)&&!Number.isSafeInteger(value))))throw new RangeError('Unsafe database number.');
  return [column,value];
 })));
 return {results,success:true,meta:{changes:result.rowsAffected}};
}
export function createTursoDatabase(client){
 const specs=new WeakMap();
 function prepare(sql,args=[]){
  const spec={sql,args};
  const statement={
   bind(...values){return prepare(sql,values)},
   async first(column){const row=normalizeTursoResult(await client.execute(spec)).results[0]??null;return column===undefined?row:row?.[column]??null},
   async all(){return normalizeTursoResult(await client.execute(spec))},
   async run(){return normalizeTursoResult(await client.execute(spec))}
  };
  specs.set(statement,spec);return statement;
 }
 return {prepare,async batch(statements){
  if(!Array.isArray(statements))throw new TypeError('Expected an array of statements.');
  if(!statements.length)return [];
  const queries=statements.map(statement=>{const spec=specs.get(statement);if(!spec)throw Error('Batch statement belongs to another database.');return spec});
  return (await client.batch(queries,'write')).map(normalizeTursoResult);
 }};
}
