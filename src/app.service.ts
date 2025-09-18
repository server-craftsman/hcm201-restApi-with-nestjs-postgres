import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) { }

  getHello(): string {
    return 'SmartChat API is running!';
  }

  async getHealth() {
    const startTime = Date.now();

    try {
      // Basic health check
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.configService.get('app.environment'),
        version: this.configService.get('app.version'),
        services: {
          api: {
            status: 'healthy',
            responseTime: Date.now() - startTime,
          },
          database: {
            status: 'unknown', // Will be checked by PrismaService
          },
          redis: {
            status: 'unknown', // Will be checked by RedisService
          },
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      };

      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
