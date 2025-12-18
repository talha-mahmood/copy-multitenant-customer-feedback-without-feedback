import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly display_name?: string;
}
