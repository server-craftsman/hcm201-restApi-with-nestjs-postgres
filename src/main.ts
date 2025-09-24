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
      );

    if (isProd) {
      builder.addServer('https://hcm201-restapi-with-nestjs-postgres.onrender.com', 'Production Server');
    } else {
      builder
        .addServer('http://localhost:51213', 'Development Server')
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
        
        :root {
          --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
          --warning-gradient: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          --danger-gradient: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          --info-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          --dark-gradient: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          --border-radius: 16px;
          --border-radius-small: 8px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.08);
          --shadow-medium: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        
        * {
          box-sizing: border-box;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a202c;
          scroll-behavior: smooth;
          background: white !important;
        }
        ${isProd ? '.swagger-ui .scheme-container, .swagger-ui .servers { display: none !important; }' : ''}
        
        .swagger-ui {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        
        .swagger-ui .topbar {
          border-bottom: 1px solid #e2e8f0 !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 1000 !important;
        }
        
        .swagger-ui .topbar .download-url-wrapper {
          display: none !important;
        }
        
        .swagger-ui .topbar .topbar-wrapper {
          max-width: 1400px !important;
          margin: 0 auto !important;
          padding: 0 32px !important;
        }
        
        .swagger-ui .topbar .topbar-wrapper .link {
          font-size: 24px !important;
          font-weight: 700 !important;
          text-decoration: none !important;
          font-family: 'Poppins', sans-serif !important;
          color: #1a202c !important;
        }
        
        .swagger-ui .wrapper {
          max-width: 1400px !important;
          margin: 0 auto !important;
        }
        
        .swagger-ui .info {
          background: white !important;
          margin: 40px 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        .swagger-ui .info .title {
          background: white !important;p
          color: #1a202c !important;
          font-size: 48px !important;
          font-weight: 800 !important;
          margin-bottom: 24px !important;
          line-height: 1.1 !important;
          text-align: center !important;
          font-family: 'Poppins', sans-serif !important;
          position: relative !important;
        }
        
        .swagger-ui .info .title::before {
          content: '' !important;
          display: block !important;
          width: 120px !important;
          height: 120px !important;
          background-image: url('https://cdn.s99.vn/z0/f9bea713f26789befe7eac8dba4fac57/p/0bf6nbpxkt/9fa9fbd0d552f07bce13005b630d9179.jpeg') !important;
          background-size: cover !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
          margin: 0 auto 20px auto !important;
          border-radius: 50% !important;
          border: 3px solid #10b981 !important;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15) !important;
        }
        
        .swagger-ui .info .description {
          background: white !important;
          color: #1a202c !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
          max-width: none !important;
        }
        
        .swagger-ui .scheme-container {
          color: #1a202c !important;
          border: none !important;
          padding: 0 !important;
          margin: 20px 0 !important;
        }
        
        .swagger-ui .servers {
          background: white !important;
          border: none !important;
          padding: 0 !important;
          margin: 20px 0 !important;
        }
        
        .swagger-ui .servers-title {
          color: #1a202c !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          margin-bottom: 8px !important;
          font-family: 'Inter', sans-serif !important;
        }
        
        .swagger-ui .servers select {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          color: #1a202c !important;
          font-size: 13px !important;
          width: auto !important;
          min-width: 300px !important;
        }
        
        .swagger-ui .auth-wrapper {
          border: none !important;
          padding: 0 !important;
          margin: 20px 0 !important;
        }
        
        .swagger-ui .auth-container {
          border: none !important;
          padding: 0 !important;
        }
        
        .swagger-ui .auth-container h4 {
          color: #1a202c !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          margin: 0 0 8px 0 !important;
          font-family: 'Inter', sans-serif !important;
        }
        
        .swagger-ui .btn.authorize {
          background: white !important;
          border: 1px solid rgb(0, 232, 97) !important;
          color: rgb(0, 232, 97) !important;
          border-radius: 6px !important;
          padding: 8px 16px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
        }
        
        .swagger-ui .btn.authorize:hover {
          background: rgb(0, 232, 97) !important;
          color: white !important;
          transform: none !important;
          box-shadow: none !important;
        }
        
        .swagger-ui .opblock-tag {
          border: 1px solid #e2e8f0 !important;
          border-radius: var(--border-radius) !important;
          margin-bottom: 32px !important;
          overflow: hidden !important;
          transition: var(--transition) !important;
        }
        
        .swagger-ui .opblock-tag:hover {
          transform: translateY(-4px) !important;
        }

        .swagger-ui .opblock-tag-section h3 {
          color: #1a202c !important;
          font-weight: 700 !important;
          font-size: 20px !important;
          padding: 24px 32px !important;
          margin: 0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
          font-family: 'Poppins', sans-serif !important;
        }
        
        .swagger-ui .opblock {
          border: none !important;
          border-radius: var(--border-radius-small) !important;
          margin: 12px 0 !important;
          overflow: hidden !important;
          transition: var(--transition) !important;
        }
        
        .swagger-ui .opblock:hover {
          transform: translateX(4px) !important;
        }
        
        .swagger-ui .opblock.opblock-get {
          background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%) !important;
          border-left: 4px solid #4caf50 !important;
        }
        
        .swagger-ui .opblock.opblock-post {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
          border-left: 4px solid #2196f3 !important;
        }
        
        .swagger-ui .opblock.opblock-put {
          background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%) !important;
          border-left: 4px solid #ff9800 !important;
        }
        
        .swagger-ui .opblock.opblock-delete {
          background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%) !important;
          border-left: 4px solid #f44336 !important;
        }
        
        .swagger-ui .opblock.opblock-patch {
          background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%) !important;
          border-left: 4px solid #9c27b0 !important;
        }
        .swagger-ui .opblock-summary {
          padding: 20px 24px !important;
          cursor: pointer !important;
          transition: var(--transition) !important;
          background: inherit !important;
        }
        
        .swagger-ui .opblock-summary:hover {
          background-color: rgba(255, 255, 255, 0.5) !important;
        }
        
        .swagger-ui .opblock-summary-method {
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          padding: 8px 16px !important;
          border-radius: 20px !important;
          color: white !important;
          min-width: 80px !important;
          text-align: center !important;
          font-family: 'JetBrains Mono', monospace !important;
          letter-spacing: 0.5px !important;
        }
        
        .swagger-ui .opblock-get .opblock-summary-method {
          background: #4caf50 !important;
        }
        
        .swagger-ui .opblock-post .opblock-summary-method {
          background: #2196f3 !important;
        }
        
        .swagger-ui .opblock-put .opblock-summary-method {
          background: #ff9800 !important;
        }
        
        .swagger-ui .opblock-delete .opblock-summary-method {
          background: #f44336 !important;
        }
        
        .swagger-ui .opblock-patch .opblock-summary-method {
          background: #9c27b0 !important;
        }
        
        .swagger-ui .opblock-summary-path {
          color: #1a202c !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-weight: 600 !important;
          font-size: 15px !important;
          margin-left: 20px !important;
        }
        
        .swagger-ui .opblock-summary-description {
          color: #64748b !important;
          font-size: 14px !important;
          margin-left: auto !important;
          font-style: italic !important;
        }
        
        .swagger-ui .btn {
          border-radius: var(--border-radius-small) !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          transition: var(--transition) !important;
          border: none !important;
          font-family: 'Inter', sans-serif !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        
        .swagger-ui .btn.execute {
          background: #10b981 !important;
          color: white !important;
          padding: 12px 24px !important;
        }
        
        .swagger-ui .btn.execute:hover {
          transform: translateY(-2px) !important;
          box-shadow: var(--shadow-medium) !important;
        }
        
        .swagger-ui .btn.cancel {
          background: #64748b !important;
          color: white !important;
        }
        
        .swagger-ui .btn.cancel:hover {
          transform: translateY(-2px) !important;
          box-shadow: var(--shadow-medium) !important;
        }
        
        .swagger-ui .opblock-body {
          border-top: 1px solid #e2e8f0 !important;
        } 
        
        .swagger-ui .opblock-section-header {
          color: #1a202c !important;
          font-weight: 700 !important;
          font-size: 16px !important;
          padding: 16px 24px !important;
          margin: 0 !important;
          border: none !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        
        .swagger-ui .parameters-container,
        .swagger-ui .responses-wrapper {

          margin: 20px 0 !important;
          overflow: hidden !important;
        }
        
        .swagger-ui .parameters-container .table-container,
        .swagger-ui .responses-wrapper .responses-inner {
          padding: 24px !important;
        }
        
        .swagger-ui table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        
        .swagger-ui table th {
          color: #1a202c !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          padding: 16px 20px !important;
          text-align: left !important;
          border: none !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        
        .swagger-ui table td {
          padding: 16px 20px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          vertical-align: top !important;
          font-size: 14px !important;
          color: #1a202c !important;
        }
        
        .swagger-ui .parameter__name {
          font-weight: 600 !important;
          color: #1a202c !important;
          font-family: 'JetBrains Mono', monospace !important;
        }
        
        .swagger-ui .parameter__type {
          color: #1a202c !important;
          font-size: 11px !important;
          font-family: 'JetBrains Mono', monospace !important;
          padding: 4px 8px !important;
          border-radius: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          font-weight: 600 !important;
          background: #f8fafc !important;
        }
        
        .swagger-ui .model-container {
          border: 1px solid #e2e8f0 !important;
          border-radius: var(--border-radius-small) !important;
          margin: 20px 0 !important;
          overflow: hidden !important;
        }
        
        .swagger-ui .model-title {
          background: #f8fafc !important;
          color: #1a202c !important;
          font-weight: 700 !important;
          padding: 16px 20px !important;
          border: none !important;
          letter-spacing: 0.5px !important;
        }
        
        .swagger-ui .model {
          padding: 20px !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 13px !important;
          line-height: 1.6 !important;
          color: #1a202c !important;
        }
        
        .swagger-ui pre {
          background: #f8fafc !important;
          color: #1a202c !important;
          padding: 20px !important;
          border-radius: var(--border-radius-small) !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 13px !important;
          overflow-x: auto !important;
          border: 1px solid #e2e8f0 !important;
        }
        
        .swagger-ui .highlight-code {
          background: #f8fafc !important;
          color: #1a202c !important;
        }
        
        .swagger-ui input[type="text"], 
        .swagger-ui input[type="password"], 
        .swagger-ui textarea, 
        .swagger-ui select {
          border: 2px solid #e2e8f0 !important;
          border-radius: var(--border-radius-small) !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          color: #1a202c !important;
          font-family: 'Inter', sans-serif !important;
          transition: var(--transition) !important;
        }
        
        .swagger-ui input[type="text"]:focus, 
        .swagger-ui input[type="password"]:focus, 
        .swagger-ui textarea:focus, 
        .swagger-ui select:focus {
          outline: none !important;
          border-color: #10b981 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15) !important;
        }
        
        .swagger-ui .response {
          margin-bottom: 20px !important;
          padding: 16px !important;
          background: white !important;
          border-left: 4px solid #10b981 !important;
          border: 1px solid #e2e8f0 !important;
        }
        
        .swagger-ui .response-col_status {
          font-family: 'JetBrains Mono', monospace !important;
          font-weight: 700 !important;
          color: #10b981 !important;    
          padding: 4px 8px !important;   
          font-size: 12px !important;
        }
        
        .swagger-ui .response-col_description {
          color: #4a5568 !important;
        }
        
        /* Schema Model */
        .swagger-ui .model-box {
          border: 1px solid #e2e8f0 !important;
          border-radius: var(--border-radius-small) !important;
          padding: 20px !important;
        }
        
        .swagger-ui .model-box .model-title {
          background: transparent !important;
          color: #1a202c !important;
          font-weight: 700 !important;
          font-size: 16px !important;
          margin-bottom: 16px !important;
          padding: 0 !important;
        }
        
        .swagger-ui .model-box .model {
          color: #1a202c !important;
          padding: 0 !important;
        }
        
        /* Schema properties */
        .swagger-ui .prop-type {
          color: #10b981 !important;
          font-family: 'JetBrains Mono', monospace !important;
        }
        
        .swagger-ui .prop-name {
          color: #1a202c !important;
          font-weight: 600 !important;
        }
        
        .swagger-ui .prop-format {
          color: #64748b !important;
          font-style: italic !important;
        }
        
        /* Tabs */
        .swagger-ui .tab {
          border: 1px solid #e2e8f0 !important;
          border-bottom: none !important;
          color: #64748b !important;
          padding: 12px 20px !important;
          cursor: pointer !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          transition: var(--transition) !important;
          font-family: 'Inter', sans-serif !important;
          letter-spacing: 0.5px !important;
        }
        
        .swagger-ui .tab.active {
          color: #1a202c !important;
          border-color: #10b981 !important;
          border-bottom-color: white !important;
          transform: translateY(-2px) !important;
        }
        
        .swagger-ui .tab:hover:not(.active) {
          background: rgba(102, 126, 234, 0.1) !important;
          color: #667eea !important;
          transform: translateY(-1px) !important;
        }
        
        .swagger-ui .tabpanel {
          border: 1px solid #e2e8f0 !important;
          border-radius: 0 var(--border-radius-small) var(--border-radius-small) var(--border-radius-small) !important;
          padding: 24px !important;
        }
        
        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05) !important;
          border-radius: 4px !important;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #10b981 !important;
          border-radius: 4px !important;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #059669 !important;
        }
        
        /* Loading animations */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .swagger-ui .opblock-tag {
          animation: slideInUp 0.5s ease-out !important;
        }
        
        /* Override any dark backgrounds */
        .swagger-ui,
        .swagger-ui *,
        .swagger-ui .wrapper,
        .swagger-ui .info,
        .swagger-ui .scheme-container,
        .swagger-ui .servers,
        .swagger-ui .auth-wrapper,
        .swagger-ui .auth-container,
        .swagger-ui .opblock-tag,
        .swagger-ui .opblock-tag-section,
        .swagger-ui .opblock-section-header,
        .swagger-ui .parameters-container,
        .swagger-ui .responses-wrapper,
        .swagger-ui .tabpanel,
        .swagger-ui .model-container,
        .swagger-ui .model-box {
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .swagger-ui .wrapper {
            padding: 16px !important;
          }
          
          .swagger-ui .info .title {
            font-size: 32px !important;
          }
          
          .swagger-ui .topbar .topbar-wrapper {
            padding: 0 16px !important;
          }
          
          .swagger-ui .opblock-summary {
            padding: 16px !important;
          }
        }
      `,
    });

    const port = configService.get('app.port') || 51213;
    const host = configService.get('app.host') || '0.0.0.0';

    await app.listen(port, host);
    console.log('\x1b[36m╔══════════════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║                        \x1b[1mDebate System API Server\x1b[0m\x1b[36m                        ║\x1b[0m');
    console.log('\x1b[36m╠══════════════════════════════════════════════════════════════════════╣\x1b[0m');
    console.log('\x1b[36m║\x1b[0m \x1b[32m📡 Status:\x1b[0m          ONLINE & READY                                    \x1b[36m║\x1b[0m');
    console.log(`\x1b[36m║\x1b[0m \x1b[34m🔗 API Endpoint:\x1b[0m    http://${host}:${port}                          \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[35m📖 Documentation:\x1b[0m  http://${host}:${port}/swagger-ui               \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[33m🎯 API v1:\x1b[0m         http://${host}:${port}/api/v1                   \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[36m⚡ Environment:\x1b[0m     ${(configService.get('app.environment') || 'development').toUpperCase().padEnd(43)}\x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[31m🛡️  Rate Limit:\x1b[0m     ${configService.get('app.rateLimit.max')} req/${Math.floor(configService.get('app.rateLimit.windowMs') / 1000 / 60)}min                              \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[37m💾 Redis Cache:\x1b[0m     Disabled                                              \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[90m🕒 Started at:\x1b[0m      ${new Date().toLocaleString().padEnd(41)}  \x1b[36m║\x1b[0m`);
    console.log('\x1b[36m╚══════════════════════════════════════════════════════════════════════╝\x1b[0m');
    console.log('\x1b[32m✨ Ready to serve intelligent conversations! ✨\x1b[0m\n');
  } catch (error) {
    console.error('Failed to start application:', error);
    throw error;
  }
}
bootstrap();
