import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { MemoryStoredFile } from 'nestjs-form-data';

export function IsAllowedFileType(
  allowedTypes: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAllowedFileType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: MemoryStoredFile | MemoryStoredFile[]) {
          if (Array.isArray(value)) {
            return value.every(
              (file) =>
                file && file.mimetype && allowedTypes.includes(file.mimetype),
            );
          }
          if (!value || !value.mimetype) return false;
          return allowedTypes.includes(value.mimetype);
        },
        defaultMessage(args: ValidationArguments) {
          return `File type must be one of: ${allowedTypes.join(', ')}`;
        },
      },
    });
  };
}
