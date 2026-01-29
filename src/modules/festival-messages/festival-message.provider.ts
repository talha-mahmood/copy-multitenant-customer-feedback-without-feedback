import { DataSource } from 'typeorm';
import { FestivalMessage } from './entities/festival-message.entity';

export const FESTIVAL_MESSAGE_REPOSITORY = 'FESTIVAL_MESSAGE_REPOSITORY';

export const festivalMessageProviders = [
  {
    provide: FESTIVAL_MESSAGE_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(FestivalMessage),
    inject: ['DATA_SOURCE'],
  },
];
