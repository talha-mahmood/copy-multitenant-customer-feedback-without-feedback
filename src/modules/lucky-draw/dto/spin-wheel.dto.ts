import { IsInt } from 'class-validator';
import { Exists } from 'src/common/decorators/exists.decorator';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';

export class SpinWheelDto {
  @Exists(() => Customer, 'id', { message: 'Customer must exist' })
  @IsInt()
  customer_id: number;

  @Exists(() => Merchant, 'id', { message: 'Merchant must exist' })
  @IsInt()
  merchant_id: number;

}
