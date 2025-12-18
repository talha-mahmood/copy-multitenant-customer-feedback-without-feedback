import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface User {
  id: number;
  email: string;
  role: number;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    request.user.id = Number(request.user.id);
    request.user.role = Number(request.user.role);
    return request.user as User;
  },
);
