import { IsNumber, IsString, IsOptional, IsIn, Min } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Admin } from 'src/modules/admins/entities/admin.entity';

export class AddCreditsDto {
  @IsNumber()
  @Min(1)
  credits: number;

  @IsString()
  credit_type: string; // e.g., "whatsapp message", "paid ads", "coupon"

  @IsNumber()
  @Min(0)
  amount: number;

  @Exists(() => Admin, 'id', { message: 'Admin must exist' })
  @IsNumber()
  admin_id: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  metadata?: any;
}
