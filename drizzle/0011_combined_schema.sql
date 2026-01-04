-- Combined schema snapshot for LobbySync
-- Generated: 2026-01-04
-- This file consolidates the effective schema from the migration files in this repo.
-- Note: `admin` table has been removed from runtime schema by refactor.

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS "user" (
    "id" serial PRIMARY KEY NOT NULL,
    "auth_id" uuid UNIQUE,
    "is_admin" boolean DEFAULT false NOT NULL,
    "age" integer
);

-- Parties
CREATE TABLE IF NOT EXISTS "party" (
    "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(255) NOT NULL DEFAULT '',
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
    "level_slot" smallint DEFAULT 0 NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Slots
CREATE TABLE IF NOT EXISTS "slot" (
    "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "raid_id" varchar(36) NOT NULL,
    "slot_order" smallint DEFAULT 0 NOT NULL,
    "position_type" varchar(20) DEFAULT 'dps' NOT NULL,
    "user_id" integer,
    "display_name" varchar(100),
    "gear_score" integer DEFAULT 0 NOT NULL,
    "status" varchar(20) DEFAULT 'open' NOT NULL,
    "locked_until" timestamp,
    "note" text,
    "pinned" boolean DEFAULT false NOT NULL,
    "role" varchar(20) DEFAULT '',
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Changelog
CREATE TABLE IF NOT EXISTS "changelog" (
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

-- Kicked records
CREATE TABLE IF NOT EXISTS "kicked" (
    "id" serial PRIMARY KEY NOT NULL,
    "party_id" varchar(36) NOT NULL,
    "user_auth_id" uuid NOT NULL,
    "kicked_by" integer NOT NULL,
    "kicked_at" timestamp DEFAULT now() NOT NULL,
    "reason" text
);

-- End of combined schema
