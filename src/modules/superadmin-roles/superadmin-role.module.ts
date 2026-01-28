import { Module } from '@nestjs/common';
import { SuperadminRoleService } from './superadmin-role.service';
import { SuperadminRoleController } from './superadmin-role.controller';
import { superadminRoleProviders } from './superadmin-role.provider';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [SuperadminRoleController],
    providers: [SuperadminRoleService, ...superadminRoleProviders],
    exports: [SuperadminRoleService],
})
export class SuperadminRoleModule { }
