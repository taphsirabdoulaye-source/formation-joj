import { Module } from '@nestjs/common';
import { SlotRepository } from './application/slot.repository';
import { OpenSlot } from './application/use-cases/open-slot';
import { RegisterVolunteer } from './application/use-cases/register-volunteer';
import { SlotsController } from './http/slots.controller';
import { DrizzleSlotRepository } from './infra/drizzle-slot.repository';

@Module({
  controllers: [SlotsController],
  providers: [
    // Le port (classe abstraite) est relié ici à son implémentation Drizzle.
    { provide: SlotRepository, useClass: DrizzleSlotRepository },
    OpenSlot,
    RegisterVolunteer,
  ],
})
export class VolunteersModule {}
