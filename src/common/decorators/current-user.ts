import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface User {
  id: number;
  email: string;
  role: number | string;
  merchantId?: number | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    request.user.id = Number(request.user.id);
    // role can be string or number
    if (typeof request.user.role === 'string' && !isNaN(Number(request.user.role))) {
      request.user.role = Number(request.user.role);
    }
    if (request.user.merchantId !== undefined && request.user.merchantId !== null) {
      request.user.merchantId = Number(request.user.merchantId);
    }
    return request.user as User;
  },
);
