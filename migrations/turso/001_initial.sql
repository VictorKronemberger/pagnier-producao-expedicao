CREATE TABLE IF NOT EXISTS production_board (
 id TEXT PRIMARY KEY, payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL, updated_by TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS chat_employees (
 name TEXT PRIMARY KEY, pin_hash TEXT NOT NULL, salt TEXT NOT NULL,
 failures INTEGER NOT NULL DEFAULT 0, locked_until INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS chat_sessions (
 token_hash TEXT PRIMARY KEY, employee TEXT NOT NULL, expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS chat_session_expiry ON chat_sessions(expires_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS chat_messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 client_id TEXT NOT NULL, channel TEXT NOT NULL, author TEXT NOT NULL, body TEXT NOT NULL,
 mentions TEXT NOT NULL, reference_order TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS chat_message_retry ON chat_messages(author,client_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS chat_message_channel ON chat_messages(channel,id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS chat_reads (
 employee TEXT NOT NULL, channel TEXT NOT NULL, last_id INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(employee,channel)
);
