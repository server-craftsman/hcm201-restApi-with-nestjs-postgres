import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  // Debug environment variables
  console.log('=== CONFIG DEBUG ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
  console.log('DATABASE_PORT:', process.env.DATABASE_PORT);
  console.log('REDIS_HOST:', process.env.REDIS_HOST);
  console.log('REDIS_PORT:', process.env.REDIS_PORT);
  console.log('PORT:', process.env.PORT);

  // Debug CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'];

  return {
    // App Configuration
    name: process.env.APP_NAME,
    description: process.env.APP_DESCRIPTION,
    version: process.env.APP_VERSION,
    prefix: process.env.APP_PREFIX,
    port: parseInt(process.env.PORT || '', 10),
    host: process.env.APP_HOST,
    environment: process.env.NODE_ENV,
    debug: process.env.APP_DEBUG,
    workingDirectory: process.env.PWD || process.cwd(),
    frontendDomain: process.env.APP_FRONTEND_DOMAIN || process.env.FRONTEND_DOMAIN,
    allowedOrigins: allowedOrigins,

    // Database Configuration
    database: {
      type: process.env.DATABASE_TYPE,
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '', 10),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      name: process.env.DATABASE_NAME,
      synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '', 10) || '',
      ssl: {
        enabled: process.env.DATABASE_SSL_ENABLED === 'true',
        rejectUnauthorized: process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
        ca: process.env.DATABASE_CA,
        key: process.env.DATABASE_KEY,
        cert: process.env.DATABASE_CERT,
      },
      url: process.env.DATABASE_URL,
    },

    // Redis Configuration for Caching and Rate Limiting
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '', 10),
      keyPrefix: process.env.REDIS_KEY_PREFIX,
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILOVER || '', 10) || '',
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '', 10) || '',
      enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
      maxMemoryPolicy: process.env.REDIS_MAX_MEMORY_POLICY,
      maxMemory: process.env.REDIS_MAX_MEMORY,
      url: process.env.REDIS_URL,
    },

    // Authentication Configuration
    auth: {
      jwt: {
        secret: process.env.AUTH_JWT_SECRET,
        expiresIn: process.env.AUTH_JWT_TOKEN_EXPIRES_IN,
        refreshSecret: process.env.AUTH_REFRESH_SECRET,
        refreshExpiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN,
        forgotSecret: process.env.AUTH_FORGOT_SECRET,
        forgotExpiresIn: process.env.AUTH_FORGOT_TOKEN_EXPIRES_IN,
        confirmEmailSecret: process.env.AUTH_CONFIRM_EMAIL_SECRET,
        confirmEmailExpiresIn: process.env.AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN,
      },
      bcrypt: {
        saltRounds: parseInt(process.env.AUTH_BCRYPT_SALT_ROUNDS || '', 10) || '',
      },
    },

    // Rate Limiting Configuration
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '', 10) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX || '', 10) || 100,
      message: process.env.RATE_LIMIT_MESSAGE,
      standardHeaders: process.env.RATE_LIMIT_STANDARD_HEADERS,
      legacyHeaders: process.env.RATE_LIMIT_LEGACY_HEADERS,
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
      skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED_REQUESTS,
    },

    // Security Configuration
    security: {
      cors: {
        enabled: process.env.CORS_ENABLED,
        origin: process.env.CORS_ORIGIN,
        credentials: process.env.CORS_CREDENTIALS,
      },
      helmet: {
        enabled: process.env.HELMET_ENABLED,
        contentSecurityPolicy: process.env.HELMET_CONTENT_SECURITY_POLICY,
        crossOriginEmbedderPolicy: process.env.HELMET_CROSS_ORIGIN_EMBEDDER_POLICY,
      },
      csrf: {
        enabled: process.env.CSRF_ENABLED,
        cookie: process.env.CSRF_COOKIE,
      },
    },

    // Mail Configuration
    mail: {
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '', 10) || 587,
      secure: process.env.MAIL_SECURE,
      user: process.env.MAIL_USER,
      password: process.env.MAIL_PASSWORD,
      defaultEmail: process.env.MAIL_DEFAULT_EMAIL,
      defaultName: process.env.MAIL_DEFAULT_NAME,
      ignoreTLS: process.env.MAIL_IGNORE_TLS,
      requireTLS: process.env.MAIL_REQUIRE_TLS,
    },

    // Logging Configuration
    logging: {
      level: process.env.LOG_LEVEL,
      format: process.env.LOG_FORMAT,
      enableRequestLogging: process.env.LOG_ENABLE_REQUEST_LOGGING,
      enableErrorLogging: process.env.LOG_ENABLE_ERROR_LOGGING,
    },

    // Cache Configuration
    cache: {
      ttl: parseInt(process.env.CACHE_TTL || '', 10) || '',
      max: parseInt(process.env.CACHE_MAX || '', 10) || '',
      checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '', 10) || '',
    },

    // WebSocket Configuration
    websocket: {
      cors: {
        origin: process.env.WS_CORS_ORIGIN,
        credentials: process.env.WS_CORS_CREDENTIALS,
      },
      pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '', 10) || '',
      pingInterval: parseInt(process.env.WS_PING_INTERVAL || '', 10) || '',
    },
  };
});
