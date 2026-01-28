import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { SuperadminRoleService } from './superadmin-role.service';
import { CreateSuperadminRoleDto } from './dto/create-superadmin-role.dto';
import { UpdateSuperadminRoleDto } from './dto/update-superadmin-role.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('superadmin-roles')
@UseGuards(JwtAuthGuard)
export class SuperadminRoleController {
    constructor(private readonly superadminRoleService: SuperadminRoleService) { }

    @Post()
    create(@Body() createSuperadminRoleDto: CreateSuperadminRoleDto) {
        return this.superadminRoleService.create(createSuperadminRoleDto);
    }

    @Get()
    findAll(
        @Query('page') page?: number,
        @Query('pageSize') pageSize?: number,
        @Query('search') search?: string,
    ) {
        return this.superadminRoleService.findAll(page, pageSize, search);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.superadminRoleService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateSuperadminRoleDto: UpdateSuperadminRoleDto,
    ) {
        return this.superadminRoleService.update(id, updateSuperadminRoleDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.superadminRoleService.remove(id);
    }
}
