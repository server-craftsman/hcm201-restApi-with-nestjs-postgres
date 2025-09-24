import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    try {
        // Create app with minimal options for production
        const app = await NestFactory.create(AppModule, {
            logger: ['error', 'warn'], // Reduce logging to save memory
            bufferLogs: true,
        });

        const configService = app.get(ConfigService);

        // Global prefix
        const prefix = configService.get('app.prefix');
        if (prefix) {
            app.setGlobalPrefix(prefix);
        }

        // Enable API versioning
        app.enableVersioning({
            type: VersioningType.URI,
            prefix: 'v',
            defaultVersion: '1',
        });

        // Minimal security headers only
        app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            next();
        });

        // Minimal validation pipe
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: false, // Disable transform to save memory
            disableErrorMessages: true, // Always disable in production
        }));

        // Minimal CORS
        app.enableCors({
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });

        // Lazy load interceptor to save memory
        try {
            const { ApiResponseInterceptor } = await import('./common/interceptors/api-response.interceptor');
            app.useGlobalInterceptors(new ApiResponseInterceptor());
        } catch (error) {
            console.warn('Failed to load ApiResponseInterceptor, continuing without it');
        }

        const port = process.env.PORT || configService.get('app.port') || 10000;
        const host = configService.get('app.host') || '0.0.0.0';

        await app.listen(port, host);

        console.log(`🚀 Production server running on http://${host}:${port}`);
        console.log(`⚡ Memory optimized for Render deployment`);
    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
}

// Aggressive memory management for production
process.setMaxListeners(0);

// Force garbage collection every 30 seconds in production
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        if (global.gc) {
            global.gc();
        }
    }, 30000);
}

bootstrap();
