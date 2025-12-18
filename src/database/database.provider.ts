import dbConfig from './data-source';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      return dbConfig.initialize();
    },
  },
];
