import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from './env';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ofside Management API',
      version: '1.0.0',
      description: 'A comprehensive API for Ofside management and booking',
      contact: {
        name: 'Ofside Team',
        email: 'support@sportsvenue.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.sportsvenue.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Venue: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            venueName: { type: 'string' },
            venueType: { type: 'string', enum: ['indoor', 'outdoor', 'hybrid'] },
            sportsOffered: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['badminton', 'tennis', 'cricket', 'football', 'basketball', 'volleyball', 'table-tennis', 'squash'],
              },
            },
            description: { type: 'string' },
            amenities: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['parking', 'wifi', 'cafe', 'locker', 'shower', 'ac', 'changing-room', 'first-aid'],
              },
            },
            is24HoursOpen: { type: 'boolean' },
            location: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                city: { type: 'string' },
                country: { type: 'string' },
                pincode: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['Point'] },
                    coordinates: {
                      type: 'array',
                      items: { type: 'number' },
                      minItems: 2,
                      maxItems: 2,
                    },
                  },
                },
              },
            },
            contact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' },
              },
            },
            owner: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' },
              },
            },
            courts: { type: 'array', items: { type: 'string' } },
            declarationAgreed: { type: 'boolean' },
            rawVenueData: { type: 'object' },
            createdBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Court: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            venue: { type: 'string' },
            name: { type: 'string' },
            sportType: {
              type: 'string',
              enum: ['badminton', 'tennis', 'cricket', 'football', 'basketball', 'volleyball', 'table-tennis', 'squash'],
            },
            surfaceType: {
              type: 'string',
              enum: ['synthetic', 'grass', 'wooden', 'concrete', 'clay', 'rubber'],
            },
            size: { type: 'string' },
            isIndoor: { type: 'boolean' },
            hasLighting: { type: 'boolean' },
            images: {
              type: 'object',
              properties: {
                cover: { type: 'string' },
                logo: { type: 'string' },
                others: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
            slotDuration: { type: 'number' },
            maxPeople: { type: 'number' },
            pricePerSlot: { type: 'number' },
            peakEnabled: { type: 'boolean' },
            peakDays: {
              type: 'array',
              items: { type: 'number' },
            },
            peakStart: { type: 'string' },
            peakEnd: { type: 'string' },
            peakPricePerSlot: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            mobile: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'number', enum: [0, 1, 2] },
            isActive: { type: 'boolean' },
            profilePicture: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Venues', description: 'Venue management endpoints' },
      { name: 'Courts', description: 'Court management endpoints' },
      { name: 'Bookings', description: 'Booking management endpoints' },
      { name: 'Rulebook', description: 'Sports rules management' },
      { name: 'Analysis', description: 'Player analytics and match management' },
      { name: 'Upload', description: 'File upload endpoints' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Ofside API Documentation',
  }));
};

export default specs;