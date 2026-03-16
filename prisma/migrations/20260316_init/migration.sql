Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_slot_templates" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "time_slot_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_dates" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,

    CONSTRAINT "special_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_slot_overrides" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "date_slot_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "booking_code" TEXT NOT NULL,
    "service_id" UUID NOT NULL,
    "booking_date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "id_number" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "special_dates_service_id_date_key" ON "special_dates"("service_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");

-- CreateIndex
CREATE INDEX "bookings_booking_date_service_id_status_idx" ON "bookings"("booking_date", "service_id", "status");

-- CreateIndex
CREATE INDEX "bookings_booking_code_idx" ON "bookings"("booking_code");

-- AddForeignKey
ALTER TABLE "time_slot_templates" ADD CONSTRAINT "time_slot_templates_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_dates" ADD CONSTRAINT "special_dates_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_slot_overrides" ADD CONSTRAINT "date_slot_overrides_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

