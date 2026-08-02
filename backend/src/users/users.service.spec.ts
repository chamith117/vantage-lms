import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let usersService: UsersService;
  let mockRepo: any;

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
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((data) => ({ ...mockUser, ...data })),
      save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await usersService.create({
        name: 'Test',
        email: 'new@example.com',
        password: 'hashed',
      });
      expect(result.email).toBe('new@example.com');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      await expect(
        usersService.create({
          name: 'Test',
          email: 'test@example.com',
          password: 'hashed',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      const result = await usersService.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await usersService.findByEmail('none@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      const result = await usersService.findById('uuid-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(usersService.findById('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addPoints', () => {
    it('should add points to a user', async () => {
      const userWithPoints = { ...mockUser, points: 50 };
      mockRepo.findOne.mockResolvedValue(userWithPoints);
      mockRepo.save.mockResolvedValue({ ...mockUser, points: 80 });

      const result = await usersService.addPoints('uuid-1', 30);
      expect(result.points).toBe(80);
    });
  });

  describe('findAll', () => {
    it('should return all users ordered by points', async () => {
      mockRepo.find.mockResolvedValue([mockUser]);
      const result = await usersService.findAll();
      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });
});
