import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { DatabaseModule } from '../../../database/database.module';
import { roleProviders } from './role.provider';
import { RoleHelper } from '../../../common/helpers/role.helper';

@Module({
  imports: [DatabaseModule],
  controllers: [RoleController],
  providers: [RoleService, RoleHelper, ...roleProviders],
  exports: [RoleService, RoleHelper, ...roleProviders],
})
export class RoleModule { }
