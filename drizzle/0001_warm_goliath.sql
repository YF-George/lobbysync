CREATE TABLE "party" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"raid_mode" smallint DEFAULT 1 NOT NULL,
	"run_type" smallint DEFAULT 1 NOT NULL,
	"start_at" timestamp,
	"owner_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'recruiting' NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"locked_by" integer,
	"locked_at" timestamp,
	"discord_webhook" text,
	"gear_limit" integer DEFAULT 0 NOT NULL,
	"max_players" smallint DEFAULT 10 NOT NULL,
	"current_players" smallint DEFAULT 0 NOT NULL,
	"note" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slot" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raid_id" varchar(36) NOT NULL,
	"slot_order" smallint DEFAULT 0 NOT NULL,
	"position_type" varchar(20) DEFAULT 'dps' NOT NULL,
	"user_id" integer,
	"display_name" varchar(100),
	"gear_score" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"locked_until" timestamp,
	"note" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
