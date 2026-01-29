import { DataSource } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

export const chatProviders = [
    {
        provide: 'CONVERSATION_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Conversation),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'MESSAGE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Message),
        inject: ['DATA_SOURCE'],
    },
];
