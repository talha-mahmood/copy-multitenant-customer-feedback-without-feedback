// exists.validator.ts
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@ValidatorConstraint({ name: 'Exists', async: true })
@Injectable()
export class ExistsConstraint implements ValidatorConstraintInterface {
  constructor(@Inject('DATA_SOURCE') private readonly dataSource: DataSource) {}

  async validate(value: any, args: ValidationArguments) {
    if (value == null) return true;

    const [EntityClass, property = 'id'] = args.constraints;
    try {
      const repo = this.dataSource.getRepository(EntityClass());
      return await repo.exist({
        where: { [property]: value }, // For better performance with large tables
        cache: true,
      });
    } catch (error) {
      console.error('Exists validation error:', error);
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const [EntityClass, property = 'id'] = args.constraints;
    return `${args.property} with value ${args.value} does not exist in ${EntityClass().name}`;
  }
}
