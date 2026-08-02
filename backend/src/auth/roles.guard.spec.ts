import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  function createMockContext(userRole?: UserRole) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { role: userRole } : undefined,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const result = rolesGuard.canActivate(createMockContext(UserRole.LEARNER));
    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    const result = rolesGuard.canActivate(createMockContext(UserRole.ADMIN));
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user has wrong role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    expect(() =>
      rolesGuard.canActivate(createMockContext(UserRole.LEARNER)),
    ).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user in request', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    expect(() =>
      rolesGuard.canActivate(createMockContext(undefined)),
    ).toThrow(ForbiddenException);
  });
});
