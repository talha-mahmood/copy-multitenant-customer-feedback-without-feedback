import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Exists } from 'src/common/decorators/exists.decorator';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/roles-permission-management/roles/entities/role.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

export class CreateUserHasRoleDto extends BaseEntity {
  @Type(() => Number)
  @IsNumber()
  @Exists(() => Role, 'id', { message: 'Role does not exist' })
  role_id: number;

  @Type(() => Number)
  @IsNumber()
  @Exists(() => User, 'id', { message: 'User does not exist' })
  user_id: number;
}