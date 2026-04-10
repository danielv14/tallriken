CREATE TABLE `login_attempts` (
	`ip` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_attempt` integer NOT NULL
);
