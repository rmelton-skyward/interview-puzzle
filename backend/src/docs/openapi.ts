import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Seat Selection API',
      version: '1.0.0',
      description:
        'REST API for the Skyward fullstack coding challenge — concert venue seat selection & booking.',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      schemas: {
        Seat: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            row: { type: 'string' },
            column: { type: 'integer' },
            status: { type: 'string', enum: ['AVAILABLE', 'RESERVED', 'BOOKED'] },
          },
        },
        BestSeatsResult: {
          type: 'object',
          properties: {
            row: { type: 'string' },
            seats: { type: 'array', items: { $ref: '#/components/schemas/Seat' } },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  // Comments are preserved by tsc, so this glob resolves both in dev (tsx, .ts sources)
  // and in the compiled production build (dist, .js output).
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const openapiSpec = swaggerJsdoc(options);
