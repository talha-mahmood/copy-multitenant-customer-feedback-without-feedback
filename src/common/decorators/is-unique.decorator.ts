import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsUniqueConstraint } from '../validators/is-unique.validator';

export function IsUnique(
  entity: any,
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [entity, property],
      validator: IsUniqueConstraint,
    });
  };
}
