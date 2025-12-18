import { NotFoundException, PipeTransform } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Type } from '@nestjs/common';

export class ModelBindingPipe implements PipeTransform {
  constructor(
    private readonly model: Type<any>,
    private readonly paramName: string,
    private readonly dataSource: DataSource,
  ) {}

  async transform(value: any) {
    if (!this.dataSource) {
      throw new Error('DataSource is undefined');
    }

    const repository: Repository<any> = this.dataSource.getRepository(
      this.model,
    );

    if (!repository) {
      throw new Error(`Repository for ${this.model.name} not found`);
    }

    const entity = await repository.findOne({
      where: { [this.paramName]: value },
    });

    if (!entity) {
      throw new NotFoundException(`${this.model.name} not found`);
    }

    return entity;
  }
}
