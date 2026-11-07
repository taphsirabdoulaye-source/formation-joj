import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { AnimationRepository } from '../application/animation.repository';
import type { Animation } from '../domain/animation';
import type { Lieu } from '../domain/lieu';
import { animationToDomain, animationToRow, lieuToDomain } from './animation.mapper';
import { animations } from './animations.schema';
import { lieux } from './lieux.schema';

@Injectable()
export class DrizzleAnimationRepository extends AnimationRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async listByDate(date: string): Promise<Animation[]> {
    const rows = await this.db
      .select()
      .from(animations)
      .innerJoin(lieux, eq(animations.lieuId, lieux.id))
      .where(eq(animations.date, date))
      .orderBy(asc(animations.heureDebut));

    return rows.map((row) => animationToDomain(row.animations, lieuToDomain(row.lieux)));
  }

  async findLieuById(id: string): Promise<Lieu | null> {
    const [row] = await this.db.select().from(lieux).where(eq(lieux.id, id)).limit(1);
    return row ? lieuToDomain(row) : null;
  }

  async insert(animation: Animation): Promise<void> {
    await this.db.insert(animations).values(animationToRow(animation));
  }
}
