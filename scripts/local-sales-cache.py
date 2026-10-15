import json,sqlite3,sys
from pathlib import Path
sys.stdin.reconfigure(encoding='utf-8')
base=Path(__file__).resolve().parents[1]/'.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
paths=[p for p in base.glob('*.sqlite') if p.name!='metadata.sqlite']
if len(paths)!=1:raise SystemExit('Banco local não identificado com segurança.')
p=paths[0]
if sys.argv[1]=='read':
 c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
 row=c.execute("SELECT payload,revision FROM production_board WHERE id='nomus'").fetchone()
 print(json.dumps({'state':json.loads(row[0]),'revision':row[1]},ensure_ascii=True))
elif sys.argv[1]=='write':
 data=json.load(sys.stdin);c=sqlite3.connect(p,timeout=15)
 result=c.execute("UPDATE production_board SET payload=?,revision=revision+1,updated_at=?,updated_by=? WHERE id='nomus' AND revision=?",(json.dumps(data['state'],ensure_ascii=False),data['at'],'Nomus',data['revision']))
 c.commit();print(json.dumps({'saved':result.rowcount==1}))
else:raise SystemExit('Ação inválida.')
