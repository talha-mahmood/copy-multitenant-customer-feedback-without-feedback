import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FestivalMessage } from './entities/festival-message.entity';
import { CreateFestivalMessageDto } from './dto/create-festival-message.dto';
import { UpdateFestivalMessageDto } from './dto/update-festival-message.dto';
import { FESTIVAL_MESSAGE_REPOSITORY } from './festival-message.provider';

@Injectable()
export class FestivalMessageService {
  constructor(
    @Inject(FESTIVAL_MESSAGE_REPOSITORY)
    private festivalMessageRepository: Repository<FestivalMessage>,
  ) {}

  async create(createDto: CreateFestivalMessageDto) {
    const festivalMessage = this.festivalMessageRepository.create(createDto);
    const saved = await this.festivalMessageRepository.save(festivalMessage);

    return {
      message: 'Festival message created successfully',
      data: saved,
    };
  }

  async findAll(merchantId?: number, isActive?: string, search?: string, page: number = 1, pageSize: number = 20) {
    const query = this.festivalMessageRepository
      .createQueryBuilder('festival')
      .leftJoinAndSelect('festival.merchant', 'merchant');

    if (merchantId) {
      query.andWhere('festival.merchant_id = :merchantId', { merchantId });
    }

    // if (isActive !== undefined) {
    //   query.andWhere('festival.is_active = :isActive', { isActive });
    // }

     // Handle filter: 'all', 'active', 'inactive' or undefined (defaults to 'all')
    if (isActive === 'active') {
      query.andWhere('festival.is_active = :isActive', { isActive: true });
    } else if (isActive === 'inactive') {
      query.andWhere('festival.is_active = :isActive', { isActive: false });
    }
    // If isActive is 'all' or undefined, don't add any filter (show all)
     // Handle search: search in festival_name and message
    if (search && search.trim()) {
      query.andWhere(
        '(LOWER(festival.festival_name) LIKE LOWER(:search) OR LOWER(festival.message) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` },
      );  
    }


    query.orderBy('festival.festival_date', 'ASC');

    const [data, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      message: 'Festival messages retrieved successfully',
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const festivalMessage = await this.festivalMessageRepository.findOne({
      where: { id },
      relations: ['merchant'],
    });

    if (!festivalMessage) {
      throw new NotFoundException(`Festival message with ID ${id} not found`);
    }

    return {
      message: 'Festival message retrieved successfully',
      data: festivalMessage,
    };
  }

  async update(id: number, updateDto: UpdateFestivalMessageDto) {
    const festivalMessage = await this.festivalMessageRepository.findOne({
      where: { id },
    });

    if (!festivalMessage) {
      throw new NotFoundException(`Festival message with ID ${id} not found`);
    }

    Object.assign(festivalMessage, updateDto);
    const updated = await this.festivalMessageRepository.save(festivalMessage);

    return {
      message: 'Festival message updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const festivalMessage = await this.festivalMessageRepository.findOne({
      where: { id },
    });

    if (!festivalMessage) {
      throw new NotFoundException(`Festival message with ID ${id} not found`);
    }

    await this.festivalMessageRepository.softDelete(id);

    return {
      message: 'Festival message deleted successfully',
    };
  }

  /**
   * Get active festival messages for a specific date (used by campaign service)
   */
  async getActiveFestivalsForDate(date: Date): Promise<FestivalMessage[]> {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Find festivals that match today's month and day
    const festivals = await this.festivalMessageRepository
      .createQueryBuilder('festival')
      .where('festival.is_active = :isActive', { isActive: true })
      .andWhere('EXTRACT(MONTH FROM festival.festival_date) = :month', { month })
      .andWhere('EXTRACT(DAY FROM festival.festival_date) = :day', { day })
      .getMany();

    return festivals;
  }

  /**
   * Get active festivals for specific merchant on a specific date
   */
  async getMerchantFestivalsForDate(merchantId: number, date: Date): Promise<FestivalMessage[]> {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const festivals = await this.festivalMessageRepository
      .createQueryBuilder('festival')
      .where('festival.merchant_id = :merchantId', { merchantId })
      .andWhere('festival.is_active = :isActive', { isActive: true })
      .andWhere('EXTRACT(MONTH FROM festival.festival_date) = :month', { month })
      .andWhere('EXTRACT(DAY FROM festival.festival_date) = :day', { day })
      .getMany();

    return festivals;
  }
}
