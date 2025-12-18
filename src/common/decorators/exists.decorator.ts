// exists.decorator.ts
import { registerDecorator, ValidationOptions } from 'class-validator';
import { ExistsConstraint } from '../validators/exists.validator';

export function Exists(
  entity: () => Function,
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: {
        ...validationOptions,
        message:
          validationOptions?.message ||
          `$property with value $value does not exist in ${entity().name}`,
      },
      constraints: [entity, property],
      validator: ExistsConstraint,
    });
  };
}
