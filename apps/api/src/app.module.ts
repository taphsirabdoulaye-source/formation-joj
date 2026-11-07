import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { DisciplinesModule } from './modules/disciplines/disciplines.module';
import { GuideTouristiqueModule } from './modules/guide-touristique/guide-touristique.module';
import { VolunteersModule } from './modules/volunteers/volunteers.module';

@Module({
  imports: [CoreModule, DisciplinesModule, GuideTouristiqueModule, VolunteersModule],
})
export class AppModule {}
