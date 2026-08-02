import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = healthController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.service).toContain('Vantage');
      expect(result.version).toBe('1.0.0');
      expect(result.timestamp).toBeDefined();
    });
  });
});
