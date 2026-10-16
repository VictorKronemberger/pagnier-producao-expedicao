// Small compatibility boundary for the existing parameterized D1 statements.
// Values always remain bound parameters; this never interpolates application data.
export function translatePostgresSql(source,values=[]) {
  const parts = [];
  let offset = 0, parameters = 0;
  const pattern = /(--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|\$([a-zA-Z_][a-zA-Z_0-9]*)?\$[\s\S]*?\$\2\$|[a-zA-Z_][a-zA-Z_0-9]*|\?|[(),])/g;
  for (const match of source.matchAll(pattern)) {
    if (match.index > offset) parts.push({text:source.slice(offset,match.index),kind:"space"});
    const text = match[0];
    parts.push({text,kind: /^[a-zA-Z_]/.test(text)?"word":text==="?"?"parameter": /^[(),]$/.test(text)?"punctuation":"literal"});
    offset = match.index + text.length;
  }
  if (offset < source.length) parts.push({text:source.slice(offset),kind:"space"});
  const next = i => {while (++i < parts.length && parts[i].kind === "space") {} return i;};
  for (let i = 0; i < parts.length; i++) {
    const part=parts[i];
    if (part.kind === "parameter") {
      const value=values[parameters];
      part.text="$"+(++parameters);
      // PostgreSQL infers CASE ... THEN $n ELSE 0 as int4 unless told otherwise,
      // even when the destination column is bigint (session/lockout timestamps).
      if(typeof value==="number"){
        if(!Number.isFinite(value)||(Number.isInteger(value)&&!Number.isSafeInteger(value)))throw new RangeError("Unsafe SQL numeric parameter.");
        part.text+=Number.isInteger(value)?"::bigint":"::double precision";
      }
      continue;
    }
    if (part.kind !== "word") continue;
    if (/^last(?:Id|At)$/i.test(part.text)) {part.text=part.text.toLowerCase()==="lastid"?'"lastId"':'"lastAt"';continue;}
    const open=next(i);
    if (parts[open]?.text!=="(") continue;
    let depth=0,comma=false,close=-1;
    for (let j=open;j<parts.length;j++) {
      if(parts[j].kind!=="punctuation")continue;
      if(parts[j].text==="(")depth++;
      else if(parts[j].text===")" && --depth===0){close=j;break;}
      else if(parts[j].text==="," && depth===1)comma=true;
    }
    if(close<0)continue;
    if (/^(MIN|MAX)$/i.test(part.text) && comma) part.text=part.text.toUpperCase()==="MIN"?"LEAST":"GREATEST";
    if (/^json_each$/i.test(part.text)) {
      part.text="jsonb_array_elements_text";
      parts[open].text="((";
      parts[close].text=")::jsonb)";
    }
  }
  return {text:parts.map(p=>p.text).join(""),parameters};
}

const numericTypes=new Set([20,21,23,26,700,701,1700]);
function normalizeResult(result) {
  if(!result || !Array.isArray(result.rows)) throw new Error("PostgreSQL fullResults is required.");
  const numeric=new Set((result.fields??[]).filter(f=>numericTypes.has(Number(f.dataTypeID))).map(f=>f.name));
  const results=result.rows.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>{
    if(value!==null && (typeof value==="bigint" || numeric.has(key))){
      const converted=Number(value);
      if(!Number.isFinite(converted) || (Number.isInteger(converted)&&!Number.isSafeInteger(converted))) throw new RangeError("PostgreSQL number exceeds JavaScript safe range.");
      return [key,converted];
    }
    return [key,value];
  })));
  return {results,success:true,meta:{changes:result.rowCount??result.affectedRows??0}};
}

export function createPostgresDatabase(sql) {
  const statements=new WeakMap();
  const options={fullResults:true,arrayMode:false};
  function prepare(source,values=[]) {
    const translated=translatePostgresSql(source,values);
    const specification={text:translated.text,values,parameters:translated.parameters};
    const query=()=>{
      if(values.length!==specification.parameters)throw new Error("SQL parameter count does not match bound values.");
      return sql.query(specification.text,values,options);
    };
    const statement={
      bind(...bound){return prepare(source,bound);},
      async first(column){const row=normalizeResult(await query()).results[0]??null;return column===undefined?row:row?.[column]??null;},
      async all(){return normalizeResult(await query());},
      async run(){return normalizeResult(await query());}
    };
    statements.set(statement,specification);
    return statement;
  }
  return {
    prepare,
    async batch(batch){
      if(!Array.isArray(batch))throw new TypeError("Expected an array of statements.");
      if(!batch.length)return [];
      const specs=batch.map(statement=>{
        const spec=statements.get(statement);
        if(!spec)throw new Error("Batch statement belongs to another database.");
        if(spec.values.length!==spec.parameters)throw new Error("SQL parameter count does not match bound values.");
        return spec;
      });
      const results=await sql.transaction(specs.map(spec=>sql.query(spec.text,spec.values,options)),options);
      return results.map(normalizeResult);
    }
  };
}
