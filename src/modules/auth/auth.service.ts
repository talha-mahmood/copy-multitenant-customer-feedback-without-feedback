import {
  Inject,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dtos/register.dto';
import { UploadFileDto } from './dtos/upload-file.dto';
import { uploadFile } from 'src/common/helpers/file-upload.helper';
import { UserHasRoleService } from '../roles-permission-management/user-has-role/user-has-role.service';
import { EncryptionHelper } from 'src/common/helpers/encryption-helper';
import { Admin } from '../admins/entities/admin.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_REPOSITORY') private userRepository: Repository<User>,
    @Inject('ADMIN_REPOSITORY') private adminRepository: Repository<Admin>,
    @Inject('MERCHANT_REPOSITORY') private merchantRepository: Repository<Merchant>,
    @Inject('CUSTOMER_REPOSITORY') private customerRepository: Repository<Customer>,
    private jwtService: JwtService,
    private userHasRoleService: UserHasRoleService,
    private encryptionHelper: EncryptionHelper,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { data: userHasRole } = await this.userHasRoleService.findByUserId(
      Number(user.id),
    );
    if (!userHasRole) {
      throw new UnprocessableEntityException('User has no roles assigned');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }


    let merchantId: number | null = null;
    const roleName = userHasRole.role.name;
    if (roleName === 'merchant') {
      const merchant = await this.merchantRepository.findOne({ where: { user_id: Number(user.id) } });
      if (merchant) {
        merchantId = merchant.id;
      }
    }
    const payload = {
      sub: user.id,
      email: user.email,
      role: userHasRole.role_id,
      merchantId,
    };
    const response: any = {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: roleName,
        merchantId,
      },
    };

    // Fetch and include role-specific object
    if (roleName === 'admin') {
      const admin = await this.adminRepository.findOne({
        where: { user_id: Number(user.id) },
      });
      if (admin) {
        response.admin = admin;
      }
    } else if (roleName === 'merchant') {
      const merchant = await this.merchantRepository.findOne({
        where: { user_id: Number(user.id) },
      });
      if (merchant) {
        response.merchant = merchant;
      }
    } else if (roleName === 'customer') {
      const customer = await this.customerRepository.findOne({
        where: { user_id: Number(user.id) },
      });
      if (customer) {
        response.customer = customer;
      }
    }

    return response;
  }

  async register(registerDto: RegisterDto) {
    const user = this.userRepository.create({
      ...registerDto,
      password: await bcrypt.hash(registerDto.password, 10),
    });
    const newUser = await this.userRepository.save(user);

    const payload = { sub: newUser.id, email: newUser.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    };
  }

  async uploadFile(uploadFileDto: UploadFileDto) {
    const { file } = uploadFileDto;

    const uploaded = await uploadFile(file, 'auth');

    return {
      message: `Uploaded file ${uploaded.fileName} successfully`,
      file: uploaded.relativePath,
    };
  }
}
