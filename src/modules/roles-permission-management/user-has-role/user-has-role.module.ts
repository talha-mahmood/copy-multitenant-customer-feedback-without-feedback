import { Module } from '@nestjs/common';
import { UserHasRoleService } from './user-has-role.service';
import { UserHasRoleController } from './user-has-role.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ExistsConstraint } from 'src/common/validators/exists.validator';
import { UserHasRoleProvider } from './user-has-role.provider';

@Module({
  controllers: [UserHasRoleController],
  providers: [UserHasRoleService, ExistsConstraint, ...UserHasRoleProvider],
  imports: [DatabaseModule],
  exports: [UserHasRoleService],
})
export class UserHasRoleModule {}
