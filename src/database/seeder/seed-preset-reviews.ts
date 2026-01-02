import { DataSource } from 'typeorm';
import { PresetReview } from '../../modules/feedbacks/entities/preset-review.entity';

export async function seedPresetReviews(dataSource: DataSource) {
  const presetReviewRepository = dataSource.getRepository(PresetReview);

  const existingDefaults = await presetReviewRepository.count({
    where: { is_system_default: true },
  });

  if (existingDefaults > 0) {
    console.log('System default preset reviews already exist. Skipping seed.');
    return;
  }

  const defaultReviews = [
    'Excellent service and great quality! Highly recommended!',
    'Amazing experience! Will definitely come back again.',
    'Outstanding service! The staff were very friendly and professional.',
    'Great value for money! Very satisfied with my purchase.',
    'Fantastic! Everything exceeded my expectations.',
    'Top-notch quality and service. Five stars!',
    'Wonderful experience from start to finish!',
    'Impressed with the attention to detail. Highly recommend!',
    'Best in town! You won\'t be disappointed.',
    'Exceptional service! Will recommend to all my friends.',
  ];

  const presetReviews = defaultReviews.map((text, index) => ({
    merchant_id: null,
    review_text: text,
    is_active: true,
    is_system_default: true,
    display_order: index + 1,
  }));

  await presetReviewRepository.save(presetReviews);
  console.log('✅ Seeded 10 system default preset reviews');
}
