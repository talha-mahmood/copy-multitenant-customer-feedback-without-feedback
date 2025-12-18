import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { instanceToPlain } from 'class-transformer';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    private configService: ConfigService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async find(id: number) {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) {
      return {
        message: 'No user found',
        data: null,
      };
    }
    return {
      message: `Success fetching user`,
      data: instanceToPlain(user),
    };
  }

  async findAll(page: number = 1, pageSize: number = 20, team: string = '', search = '') {
    // Build the query with team filtering
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.currentTeam', 'team');

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (team && team.trim() !== '') {
      queryBuilder.andWhere('team.name ILIKE :teamName', { teamName: `%${team}%` });
    }

    // Add pagination and ordering
    queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('user.name', 'ASC');

    const [results, total] = await queryBuilder.getManyAndCount();

    if (total > 0) {
      const plainResults = results.map((user) => instanceToPlain(user));
      return {
        message: 'users found',
        data: {
          users: plainResults,
          total,
          page,
          pageSize,
          team: team || 'all',
        },
      };
    }

    return {
      message: 'No users found',
      data: {
        users: [],
        total: 0,
        page,
        pageSize,
        team: team || 'all',
      },
    };
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = await this.userRepository.save(createUserDto);
      return {
        message: 'user created successfully',
        user: instanceToPlain(user),
      };
    } catch (error) {
      return {
        message: error.message,
        error: error,
      };
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) {
      throw new HttpException('No user found to update', 400);
    }
    Object.assign(user, updateUserDto);
    const updated = await this.userRepository.save(user);
    return {
      message: `Success updating user`,
      data: instanceToPlain(updated),
    };
  }

  async remove(id: number) {
    const result = await this.userRepository.delete(id);
    if (result?.affected && result?.affected > 0) {
      return {
        message: `Success deleting user`,
      };
    }
    throw new HttpException('No user found to delete', 400);
  }

  async updatePassword(id: number, resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) {
      throw new HttpException('No user found to update password', 400);
    }
    user.password = await bcrypt.hash(resetPasswordDto.new_password, 10);
    await this.userRepository.save(user);
    return {
      message: `Success updating password for ${user.id}`,
      data: instanceToPlain(user),
    };
  }

  async requestResetPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email: email } });
    if (!user) {
      throw new HttpException('No user found with this email', 404);
    }
    const token = this.jwtService.sign(
      { userId: user.id, email: user.email },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      },
    );
    await this.emailService.sendPasswordReset(email, token);

    return {
      message:
        'An email containing a reset password link has been sent to your email address. Please check your inbox or spam/junk mail.',
    };
  }

  async resetPasswordWithToken(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }) as { userId: number; email: string };
      const user = await this.userRepository.findOne({
        where: { id: payload.userId, email: payload.email },
      });
      if (!user) {
        throw new HttpException('Invalid token', 400);
      }
      user.password = await bcrypt.hash(newPassword, 10);
      await this.userRepository.save(user);
      return { message: 'Password reset successfully' };
    } catch (err) {
      throw new HttpException('Invalid or expired token', 400);
    }
  }
}
