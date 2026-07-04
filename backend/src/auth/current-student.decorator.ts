import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface AuthenticatedStudent {
  id: string;
  email: string;
}

export const CurrentStudent = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedStudent => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
