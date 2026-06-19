CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
