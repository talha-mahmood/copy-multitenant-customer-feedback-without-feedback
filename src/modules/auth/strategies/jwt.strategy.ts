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
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role, // now always string
      superAdminId: payload.superAdminId,
      merchantId: payload.merchantId,
      adminId: payload.adminId,
      financeViewerId: payload.financeViewerId,
      adApproverId: payload.adApproverId,
      supportStaffId: payload.supportStaffId,
      // Note: customerId removed - customers don't have user accounts anymore
    };
  }
}
