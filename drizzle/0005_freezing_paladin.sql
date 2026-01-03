CREATE TABLE "admin" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"note" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_user_id_unique" UNIQUE("user_id")
);
