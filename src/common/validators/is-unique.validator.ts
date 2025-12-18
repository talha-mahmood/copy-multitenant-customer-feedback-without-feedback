import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@ValidatorConstraint({ name: 'IsUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(@Inject('DATA_SOURCE') private readonly dataSource: DataSource) {}

  async validate(value: any, args: ValidationArguments) {
    if (value == null) return true;
    const [EntityClass, property = 'id'] = args.constraints;
    try {
      const repo = this.dataSource.getRepository(EntityClass());
      return !(await repo.exist({
        where: { [property]: value }, // For better performance with large tables
        cache: true,
      }));
    } catch (error) {
      console.error('Unique validation error:', error);
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const [EntityClass, property = 'id'] = args.constraints;
    return `${args.property} with value ${args.value} is not  unique in ${EntityClass().name}`;
  }
}
