import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class HealthController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'Vantage LMS Backend API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
