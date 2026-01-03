ALTER TABLE "slot" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "slot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();