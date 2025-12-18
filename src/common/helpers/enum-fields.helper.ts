export function generateEnumList(enumType: any, fieldName = 'Value'): string {
  const enumValues = getEnumValues(enumType);

  if (enumValues.length === 0) return '';

  if (enumValues.length === 1) {
    return `${fieldName} must be ${enumValues[0]}`;
  }

  return `${fieldName} must be either ${getEnumsString(enumType, 'or')}`;
}

export function getEnumsString(
  enumType: any,
  operator: string = 'and',
): string {
  const enumValues = getEnumValues(enumType);

  const lastValue = enumValues[enumValues.length - 1];
  const initialValues = enumValues.slice(0, -1).join(', ');

  return `${initialValues} ${operator} ${lastValue}`;
}

export function getEnumValues(enumType: any): Array<string> {
  return Object.values(enumType);
}

export function getEnumNames(enumType: any): Array<string> {
  return Object.keys(enumType);
}
