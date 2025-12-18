import { TableColumn } from 'typeorm';

export function getTimestampColumns(): TableColumn[] {
  return [
    new TableColumn({
      name: 'deleted_at',
      type: 'timestamp',
      isNullable: true,
    }),
    new TableColumn({
      name: 'created_at',
      type: 'timestamp',
      default: 'now()',
      isNullable: false,
    }),
    new TableColumn({
      name: 'updated_at',
      type: 'timestamp',
      default: 'now()',
      isNullable: false,
    }),
  ];
}
