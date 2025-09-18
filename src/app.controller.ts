import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiResponseDto } from './common/dto/api-response.dto';

@ApiTags('Health')
@Controller({
  path: '',
  version: '1',
})
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the API is running',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    type: ApiResponseDto,
    schema: {
      example: {
        statusCode: 200,
        message: 'SmartChat API is running',
        data: {
          status: 'healthy',
          timestamp: '2024-01-01T00:00:00.000Z',
          uptime: 123456,
          environment: 'development',
          version: '1.0.0',
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  getHello(): ApiResponseDto {
    return {
      statusCode: 200,
      message: 'SmartChat API is running',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Detailed health check',
    description: 'Check the health of all services (database, redis, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'All services are healthy',
    type: ApiResponseDto,
  })
  async getHealth(): Promise<ApiResponseDto> {
    const health = await this.appService.getHealth();
    return {
      statusCode: 200,
      message: 'Health check completed',
      data: health,
      timestamp: new Date().toISOString(),
    };
  }
}
