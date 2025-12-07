import swaggerJsdoc from 'swagger-jsdoc';
import config from './env.config.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Prompt Pal Backend API',
    version: '1.0.0',
    description: 'Backend API for Prompt Pal',
    contact: {
      name: 'CCTechEt',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.promptpal.com/api/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'jwt',
        description: 'JWT token stored in httpOnly cookie',
      },
    },
  },
  security: [],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Users',
      description: 'User profile management',
    },
    {
      name: 'Admin',
      description: 'Admin endpoints for platform management',
    },
    {
      name: 'Prompts',
      description: 'Prompt creation, management, and discovery endpoints',
    },
  ],
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
