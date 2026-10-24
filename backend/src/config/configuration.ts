export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  publicAccessEnabled:
    process.env.PUBLIC_ACCESS_ENABLE === 'true' ||
    process.env.PUBLIC_ACCESS_ENABLE === '1',
  serviceApiKey: process.env.SERVICE_API_KEY || 'default-service-key-change-in-production',
  operatorAdminPassword:
    process.env.OPERATOR_ADMIN_PASSWORD || 'AdminDataContract2026!',
  jwt: {
    secret:
      process.env.JWT_SECRET || 'dev-data-contract-monitor-jwt-secret-key-32-chars-min',
    expiresIn: '24h',
  },
  database: {
    uri: process.env.MONGODB_URI || '',
  },
  redis: {
    url: process.env.REDIS_URL || '',
  },
  aiPlatform: {
    url: process.env.AI_PLATFORM_URL || 'https://ai-platform.onrender.com',
    apiKey: process.env.AI_PLATFORM_API_KEY || '',
    applicationId: 'ai-data-contract-schema-drift-monitor',
    tenantId: 'data-engineering',
  },
  notificationService: {
    url:
      process.env.NOTIFICATION_SERVICE_URL ||
      'https://notification-service.onrender.com',
    apiKey: process.env.NOTIFICATION_SERVICE_API_KEY || '',
    alertEmailRecipient:
      process.env.ALERT_EMAIL_RECIPIENT || 'data-platform-oncall@company.internal',
  },
});
