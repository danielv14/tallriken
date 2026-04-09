ALTER TABLE `recipes` ADD `last_cooked_at` integer;--> statement-breakpoint
ALTER TABLE `recipes` ADD `cook_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_menu_items` ADD `completed_at` integer;