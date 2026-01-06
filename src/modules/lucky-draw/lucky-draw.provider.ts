import { DataSource } from 'typeorm';
import { LuckyDrawPrize } from './entities/lucky-draw-prize.entity';
import { LuckyDrawResult } from './entities/lucky-draw-result.entity';

export const LUCKY_DRAW_PRIZE_REPOSITORY = 'LUCKY_DRAW_PRIZE_REPOSITORY';
export const LUCKY_DRAW_RESULT_REPOSITORY = 'LUCKY_DRAW_RESULT_REPOSITORY';

export const luckyDrawProviders = [
  {
    provide: LUCKY_DRAW_PRIZE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(LuckyDrawPrize),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: LUCKY_DRAW_RESULT_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(LuckyDrawResult),
    inject: ['DATA_SOURCE'],
  },
];
