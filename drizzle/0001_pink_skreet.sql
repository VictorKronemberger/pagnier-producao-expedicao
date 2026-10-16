CREATE TABLE `chat_employees` (
	`name` text PRIMARY KEY NOT NULL,
	`pin_hash` text NOT NULL,
	`salt` text NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` text NOT NULL,
	`channel` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`mentions` text NOT NULL,
	`reference_order` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_message_retry` ON `chat_messages` (`author`,`client_id`);--> statement-breakpoint
CREATE INDEX `chat_message_channel` ON `chat_messages` (`channel`,`id`);--> statement-breakpoint
CREATE TABLE `chat_reads` (
	`employee` text NOT NULL,
	`channel` text NOT NULL,
	`last_id` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`employee`, `channel`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`employee` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chat_session_expiry` ON `chat_sessions` (`expires_at`);