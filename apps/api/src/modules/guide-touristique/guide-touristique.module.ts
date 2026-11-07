import { Module } from '@nestjs/common';
import { AnimationRepository } from './application/animation.repository';
import { GetAnimationsEnCours } from './application/use-cases/get-animations-en-cours';
import { ListAnimationsDuJour } from './application/use-cases/list-animations-du-jour';
import { GuideTouristiqueController } from './http/guide-touristique.controller';
import { DrizzleAnimationRepository } from './infra/drizzle-animation.repository';

@Module({
  controllers: [GuideTouristiqueController],
  providers: [
    // Le port (classe abstraite) est relié ici à son implémentation Drizzle.
    { provide: AnimationRepository, useClass: DrizzleAnimationRepository },
    ListAnimationsDuJour,
    GetAnimationsEnCours,
  ],
})
export class GuideTouristiqueModule {}
