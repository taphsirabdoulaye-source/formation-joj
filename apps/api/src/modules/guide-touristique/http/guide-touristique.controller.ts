import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  animationSchema,
  type AnimationResponse,
  atQuerySchema,
  dateParamsSchema,
} from '@joj/shared';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
import { GetAnimationsEnCours } from '../application/use-cases/get-animations-en-cours';
import { ListAnimationsDuJour } from '../application/use-cases/list-animations-du-jour';
import type { Animation } from '../domain/animation';

class DateParamsDto extends createZodDto(dateParamsSchema) {}
class AtQueryDto extends createZodDto(atQuerySchema) {}
class AnimationDto extends createZodDto(animationSchema) {}

/** Couche fine : valider (DTO zod), appeler un cas d'usage, sérialiser. Aucune règle métier ici. */
@ApiTags('guide-touristique')
@Controller('guide-touristique')
export class GuideTouristiqueController {
  constructor(
    private readonly listAnimationsDuJour: ListAnimationsDuJour,
    private readonly getAnimationsEnCours: GetAnimationsEnCours,
  ) {}

  /** GET /api/guide-touristique/agenda/:date — animations du jour, triées par heureDebut. */
  @Get('agenda/:date')
  @ZodSerializerDto([AnimationDto])
  async agenda(@Param() { date }: DateParamsDto): Promise<AnimationResponse[]> {
    return (await this.listAnimationsDuJour.execute(date)).map(toResponse);
  }

  /** GET /api/guide-touristique/en-cours?at=2026-11-01T10:30:00Z — animations en cours. */
  @Get('en-cours')
  @ZodSerializerDto([AnimationDto])
  async enCours(@Query() { at }: AtQueryDto): Promise<AnimationResponse[]> {
    return (await this.getAnimationsEnCours.execute(at)).map(toResponse);
  }
}

function toResponse(animation: Animation): AnimationResponse {
  return {
    id: animation.id,
    nom: animation.nom,
    date: animation.date,
    heureDebut: animation.heureDebut,
    heureFin: animation.heureFin,
    lieu: {
      id: animation.lieu.id,
      nom: animation.lieu.nom,
      quartier: animation.lieu.quartier,
      type: animation.lieu.type,
    },
  };
}
