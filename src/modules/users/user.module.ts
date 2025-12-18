import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { userProvider } from './user.provider';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, JwtModule, EmailModule],
  controllers: [UserController],
  providers: [UserService, ...userProvider, ConfigService],
  exports: [UserService],
})
export class UserModule {}
