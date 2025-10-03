import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
const compression = require('compression');

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
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

    // Security middleware
    const helmetEnabled = configService.get('app.security.helmet.enabled');
    if (helmetEnabled !== false) {
      app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'"]
          },
        },
      }));
    }

    // Compression
    app.use(compression());

    // Global validation pipe
    const appDebug = configService.get('app.debug') === 'true';
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Allow enabling detailed errors in production via APP_DEBUG=true
      disableErrorMessages: !appDebug && configService.get('app.environment') === 'production',
    }));

    // Global API response interceptor
    app.useGlobalInterceptors(new ApiResponseInterceptor());

    // CORS configuration
    const allowedOrigins = configService.get('app.allowedOrigins') || [];
    const corsEnabled = configService.get('app.security.cors.enabled');
    const environment = configService.get('app.environment');

    if (corsEnabled !== false) {
      // In development, allow all origins for easier testing
      if (environment === 'development') {
        app.enableCors({
          origin: true,
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
          exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
          optionsSuccessStatus: 204,
        });
      } else {
        // In production: if '*' configured, allow all; otherwise, strict allowlist
        const allowAll = allowedOrigins.includes('*');
        app.enableCors({
          origin: allowAll
            ? true
            : (origin, callback) => {
              if (!origin) {
                return callback(null, true);
              }
              if (allowedOrigins.includes(origin)) {
                return callback(null, true);
              }
              return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
            },
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
          exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
          optionsSuccessStatus: 204,
        });
      }
    }

    // Swagger configuration
    const isProd = (configService.get('app.environment') || process.env.NODE_ENV) === 'production';
    const builder = new DocumentBuilder()
      .setTitle('Debate System API')
      .setDescription('Comprehensive API for Debate System - an intelligent chat platform with AI-powered conversations, real-time messaging, and advanced chat management features.')
      .setVersion('1.0.0')
      .addTag('Authentication', 'User authentication and authorization endpoints')
      .addTag('Debate', 'Debate rooms, messaging and conversation management')
      .addTag('Users', 'User profile management and settings')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter your JWT authentication token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addSecurityRequirements('JWT-auth');

    if (isProd) {
      builder.addServer('https://hcm201-restapi-with-nestjs-postgres.onrender.com', 'Production Server');
    } else {
      builder
        .addServer('http://localhost:6969', 'Development Server')
        .addServer('https://hcm201-restapi-with-nestjs-postgres.onrender.com', 'Production Server');
    }

    const config = builder.build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger-ui', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        filter: true,
        showRequestDuration: true,
        syntaxHighlight: {
          activate: true,
          theme: 'agate',
        },
        layout: 'BaseLayout',
        deepLinking: true,
        displayOperationId: false,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        defaultModelRendering: 'example',
        displayRequestDuration: true,
        docExpansion: 'list',
        maxDisplayedTags: 10,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        validatorUrl: null,
      },
      customSiteTitle: 'Debate System API - Intelligent Chat Platform',
      customfavIcon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzEwYjk4MSI+PHBhdGggZD0iTTIwIDJINGMtMS4xIDAtMiAuOS0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxNGw0IDRWNGMwLTEuMS0uOS0yLTItMnoiLz48L3N2Zz4=',
      customCss: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Poppins:wght@400;500;600;700&display=swap');
        /* ... (CSS unchanged for brevity) ... */
      `,
    });

    // Fix: Only use host if it's a valid hostname, otherwise default to '0.0.0.0'
    // Also, print correct API endpoint and documentation URLs for local and production
    // Using port 3000 as default since it typically doesn't require elevated privileges
    const port = process.env.PORT || configService.get('app.port') || 3000;
    let host = configService.get('app.host');
    if (!host || host === 'http://localhost:' || host === 'localhost') {
      host = '0.0.0.0';
    }

    await app.listen(port, host);

    // Determine displayHost for pretty printing (localhost for local dev, otherwise host)
    let displayHost = host;
    if (host === '0.0.0.0' || host === '::') {
      displayHost = 'localhost';
    }

    // Print correct URLs
    console.log('\x1b[36m╔══════════════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║                        \x1b[1mDebate System API Server\x1b[0m\x1b[36m                        ║\x1b[0m');
    console.log('\x1b[36m╠══════════════════════════════════════════════════════════════════════╣\x1b[0m');
    console.log('\x1b[36m║\x1b[0m \x1b[32m📡 Status:\x1b[0m          ONLINE & READY                                    \x1b[36m║\x1b[0m');
    console.log(`\x1b[36m║\x1b[0m \x1b[34m🔗 API Endpoint:\x1b[0m    http://${displayHost}:${port}                          \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[35m📖 Documentation:\x1b[0m  http://${displayHost}:${port}/swagger-ui               \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[33m🎯 API v1:\x1b[0m         http://${displayHost}:${port}/api/v1                   \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[36m⚡ Environment:\x1b[0m     ${(configService.get('app.environment') || 'development').toUpperCase().padEnd(43)}\x1b[36m║\x1b[0m`);
    const rateLimitMax = configService.get('app.rateLimit.max');
    const rateLimitWindowMs = configService.get('app.rateLimit.windowMs');
    let rateLimitStr = 'N/A';
    if (rateLimitMax && rateLimitWindowMs) {
      rateLimitStr = `${rateLimitMax} req/${Math.floor(rateLimitWindowMs / 1000 / 60)}min`;
    }
    console.log(`\x1b[36m║\x1b[0m \x1b[31m🛡️  Rate Limit:\x1b[0m     ${rateLimitStr.padEnd(48)}\x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[37m💾 Redis Cache:\x1b[0m     Disabled                                              \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[90m🕒 Started at:\x1b[0m      ${new Date().toLocaleString().padEnd(41)}  \x1b[36m║\x1b[0m`);
    console.log('\x1b[36m╚══════════════════════════════════════════════════════════════════════╝\x1b[0m');
    console.log('\x1b[32m✨ Ready to serve intelligent conversations! ✨\x1b[0m\n');
  } catch (error) {
    // Fix: Print error and exit with non-zero code
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
