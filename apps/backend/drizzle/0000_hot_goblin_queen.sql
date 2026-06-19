CREATE TYPE "public"."currency" AS ENUM('USD', 'EUR', 'GBP');--> statement-breakpoint
CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" integer NOT NULL,
	"currency" "currency" NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
