import { DataSource } from 'typeorm';
import { WhatsAppMessage } from './entities/whatsapp-message.entity';

export const WHATSAPP_MESSAGE_REPOSITORY = 'WHATSAPP_MESSAGE_REPOSITORY';

export const whatsappProviders = [
  {
    provide: WHATSAPP_MESSAGE_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(WhatsAppMessage),
    inject: ['DATA_SOURCE'],
  },
];
