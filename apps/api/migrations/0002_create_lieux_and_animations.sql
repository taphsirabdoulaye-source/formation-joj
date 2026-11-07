CREATE TABLE "animations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nom" varchar(150) NOT NULL,
	"date" date NOT NULL,
	"heure_debut" time NOT NULL,
	"heure_fin" time NOT NULL,
	"lieu_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lieux" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nom" varchar(150) NOT NULL,
	"quartier" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "animations" ADD CONSTRAINT "animations_lieu_id_lieux_id_fk" FOREIGN KEY ("lieu_id") REFERENCES "public"."lieux"("id") ON DELETE no action ON UPDATE no action;