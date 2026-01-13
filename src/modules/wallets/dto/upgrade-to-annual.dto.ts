import { IsNumber } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Admin } from 'src/modules/admins/entities/admin.entity';

export class UpgradeToAnnualDto {
  @Exists(() => Admin, 'id', { message: 'Admin must exist' })
  @IsNumber()
  admin_id: number;
}
