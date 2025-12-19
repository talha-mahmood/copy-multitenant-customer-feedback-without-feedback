import { DataSource } from 'typeorm';
import { AdminWallet } from './entities/admin-wallet.entity';
import { MerchantWallet } from './entities/merchant-wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { CreditPackage } from './entities/credit-package.entity';

export const ADMIN_WALLET_REPOSITORY = 'ADMIN_WALLET_REPOSITORY';
export const MERCHANT_WALLET_REPOSITORY = 'MERCHANT_WALLET_REPOSITORY';
export const WALLET_TRANSACTION_REPOSITORY = 'WALLET_TRANSACTION_REPOSITORY';
export const CREDIT_PACKAGE_REPOSITORY = 'CREDIT_PACKAGE_REPOSITORY';

export const walletProviders = [
  {
    provide: ADMIN_WALLET_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(AdminWallet),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: MERCHANT_WALLET_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(MerchantWallet),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: WALLET_TRANSACTION_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(WalletTransaction),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: CREDIT_PACKAGE_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(CreditPackage),
    inject: ['DATA_SOURCE'],
  },
];
