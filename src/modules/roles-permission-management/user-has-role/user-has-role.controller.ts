import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserHasRoleService } from './user-has-role.service';
import { CreateUserHasRoleDto } from './dto/create-user-has-role.dto';
import { UpdateUserHasRoleDto } from './dto/update-user-has-role.dto';

@Controller('user-has-role')
export class UserHasRoleController {
  constructor(private readonly userHasRoleService: UserHasRoleService) {}

  @Post()
  create(@Body() createUserHasRoleDto: CreateUserHasRoleDto) {
    return this.userHasRoleService.create(createUserHasRoleDto);
  }

  @Get()
  findAll() {
    return this.userHasRoleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userHasRoleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserHasRoleDto: UpdateUserHasRoleDto) {
    return this.userHasRoleService.update(+id, updateUserHasRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userHasRoleService.remove(+id);
  }
}
