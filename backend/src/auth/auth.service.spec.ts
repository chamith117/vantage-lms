import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'uuid-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: UserRole.LEARNER,
    organization_id: 'vantage-demo-corp-id',
    points: 0,
    avatar_url: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  describe('register', () => {
    it('should register a new user and return user + token', async () => {
      usersService.create.mockResolvedValue(mockUser as any);

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.create.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(
        authService.register({
          name: 'Test',
          email: 'existing@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const userWithHash = { ...mockUser, password: 'hashedpassword' };
      usersService.findByEmail.mockResolvedValue(userWithHash as any);

      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true as never);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false as never);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
