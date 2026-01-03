CREATE TABLE "changelog" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" varchar(36) NOT NULL,
	"actor_id" integer,
	"actor_name" varchar(100),
	"action" varchar(50) NOT NULL,
	"target_type" varchar(20),
	"target_id" varchar(36),
	"field" varchar(50),
	"old_value" text,
	"new_value" text,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kicked" (
	"id" serial PRIMARY KEY NOT NULL,
	"party_id" varchar(36) NOT NULL,
	"user_auth_id" uuid NOT NULL,
	"kicked_by" integer NOT NULL,
	"kicked_at" timestamp DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN "role" varchar(20) DEFAULT '';