ALTER TABLE "user" ADD COLUMN "auth_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_auth_id_unique" UNIQUE("auth_id");