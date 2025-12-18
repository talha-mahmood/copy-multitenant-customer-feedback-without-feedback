import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsUnique } from '../../../../common/decorators/is-unique.decorator';
import { Role } from '../entities/role.entity';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Name field is required' })
  @IsString()
  @MaxLength(255)
  @IsUnique(() => Role, 'name', { message: 'Role name must be unique' })
  readonly name: string;


  @IsString()
  @IsNotEmpty({ message: 'Display Name field is required' })
  @MaxLength(255)
  @IsUnique(() => Role, 'name', { message: 'Role name must be unique' })
  readonly display_name?: string;
}
