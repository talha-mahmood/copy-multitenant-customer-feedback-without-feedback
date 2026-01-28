import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('APP_KEY'), // Use configService directly
    });
  }

  validate(payload: any) {
    const user: any = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    // Only add role IDs if they exist in the payload
    if (payload.superAdminId !== undefined) user.superAdminId = payload.superAdminId;
    if (payload.merchantId !== undefined) user.merchantId = payload.merchantId;
    if (payload.adminId !== undefined) user.adminId = payload.adminId;
    if (payload.financeViewerId !== undefined) user.financeViewerId = payload.financeViewerId;
    if (payload.adApproverId !== undefined) user.adApproverId = payload.adApproverId;
    if (payload.supportStaffId !== undefined) user.supportStaffId = payload.supportStaffId;
    if (payload.customerId !== undefined) user.customerId = payload.customerId;

    return user;
  }
}
