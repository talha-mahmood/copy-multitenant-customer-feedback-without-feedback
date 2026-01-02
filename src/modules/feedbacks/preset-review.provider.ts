import { DataSource } from 'typeorm';
import { PresetReview } from './entities/preset-review.entity';

export const presetReviewProvider = [
  {
    provide: 'PRESET_REVIEW_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(PresetReview),
    inject: ['DATA_SOURCE'],
  },
];
