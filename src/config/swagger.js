import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CrossFit WOD AI API',
      version: '2.0.0',
      description: `
        A comprehensive AI-powered API for generating personalized CrossFit workouts, coaching cues, and exercise modifications.
        
        ## Features
        - 🏋️ AI-generated personalized workouts
        - 💬 Expert coaching cues and tips
        - 🔄 Exercise modifications and scaling
        - 📊 Subscription-based usage tracking
        - 🔐 Secure authentication with Supabase
        - 📈 Performance analytics
        
        ## Authentication
        This API supports two authentication methods:
        1. **JWT Bearer Token** - For web and mobile app authentication
        2. **API Token** - For programmatic access (Pro/Elite plans only)
        
        ## Rate Limits
        - **Free Plan**: 10 workouts/month
        - **Pro Plan**: 100 workouts/month + coaching cues & modifications
        - **Elite Plan**: Unlimited usage + priority support
        
        ## Getting Started
        1. Sign up for an account at \`POST /auth/signup\`
        2. Login to get your JWT token at \`POST /auth/login\`
        3. Use the token in the Authorization header: \`Bearer YOUR_TOKEN\`
        4. Start generating workouts at \`POST /wod/generate\`
      `,
      termsOfService: 'https://your-domain.com/terms',
      contact: {
        name: 'API Support',
        email: 'support@your-domain.com',
        url: 'https://your-domain.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v2',
        description: 'Development server'
      },
      {
        url: 'https://your-production-domain.com/api/v2',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        },
        apiToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Token',
          description: 'API token for programmatic access (Pro/Elite plans)'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            displayName: {
              type: 'string',
              description: 'User display name'
            },
            fitnessLevel: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              description: 'User fitness experience level'
            },
            goals: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'User fitness goals'
            }
          }
        },
        Workout: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Creative workout name'
            },
            type: {
              type: 'string',
              enum: ['for_time', 'amrap', 'emom', 'tabata', 'strength', 'chipper'],
              description: 'Workout format type'
            },
            description: {
              type: 'string',
              description: 'Brief workout description'
            },
            timeCapMinutes: {
              type: 'integer',
              nullable: true,
              description: 'Time limit in minutes'
            },
            rounds: {
              type: 'integer',
              nullable: true,
              description: 'Number of rounds'
            },
            movements: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Movement'
              },
              description: 'Workout exercises'
            },
            warmup: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Warmup exercises'
            },
            cooldown: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Cooldown exercises'
            },
            instructions: {
              type: 'string',
              description: 'How to perform the workout'
            },
            difficultyScore: {
              type: 'number',
              minimum: 1,
              maximum: 10,
              description: 'Difficulty rating'
            },
            estimatedDurationMinutes: {
              type: 'integer',
              description: 'Expected workout duration'
            }
          },
          required: ['name', 'type', 'movements']
        },
        Movement: {
          type: 'object',
          properties: {
            exerciseId: {
              type: 'string',
              description: 'Unique exercise identifier'
            },
            exerciseName: {
              type: 'string',
              description: 'Exercise name'
            },
            reps: {
              type: 'integer',
              description: 'Number of repetitions'
            },
            weight: {
              type: 'number',
              nullable: true,
              description: 'Weight in specified unit'
            },
            unit: {
              type: 'string',
              enum: ['lbs', 'kg', 'bodyweight'],
              description: 'Weight unit'
            },
            notes: {
              type: 'string',
              description: 'Form cues or scaling notes'
            }
          },
          required: ['exerciseId', 'exerciseName', 'reps', 'unit']
        },
        ExerciseModifications: {
          type: 'object',
          properties: {
            easier: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Easier variations of the exercise'
            },
            harder: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'More challenging progressions'
            },
            equipmentAlternatives: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Equipment substitutions'
            },
            injuryModifications: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Injury-safe alternatives'
            },
            techniqueTips: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Key technique points'
            }
          }
        },
        SubscriptionPlan: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              enum: ['free', 'pro', 'elite']
            },
            displayName: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            priceMonthly: {
              type: 'number'
            },
            priceYearly: {
              type: 'number',
              nullable: true
            },
            features: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            limits: {
              type: 'object',
              properties: {
                workoutsPerMonth: {
                  type: 'integer',
                  description: '-1 for unlimited'
                },
                coachingCuesPerMonth: {
                  type: 'integer'
                },
                modificationsPerMonth: {
                  type: 'integer'
                }
              }
            }
          }
        },
        UsageStats: {
          type: 'object',
          properties: {
            workouts: {
              type: 'object',
              properties: {
                used: {
                  type: 'integer'
                },
                limit: {
                  type: 'integer'
                },
                remaining: {
                  type: 'integer'
                }
              }
            },
            coachingCues: {
              type: 'object',
              properties: {
                used: {
                  type: 'integer'
                },
                limit: {
                  type: 'integer'
                },
                remaining: {
                  type: 'integer'
                }
              }
            },
            modifications: {
              type: 'object',
              properties: {
                used: {
                  type: 'integer'
                },
                limit: {
                  type: 'integer'
                },
                remaining: {
                  type: 'integer'
                }
              }
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if request was successful'
            },
            message: {
              type: 'string',
              description: 'Human-readable message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            metadata: {
              type: 'object',
              properties: {
                generatedAt: {
                  type: 'string',
                  format: 'date-time'
                },
                provider: {
                  type: 'string',
                  enum: ['claude-langchain', 'claude', 'openai', 'gemini']
                },
                requestId: {
                  type: 'string'
                }
              }
            }
          },
          required: ['success']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            details: {
              type: 'string',
              description: 'Additional error details'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            path: {
              type: 'string',
              description: 'API endpoint that generated the error'
            }
          },
          required: ['error', 'message', 'statusCode']
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: true,
                message: 'Authentication required',
                statusCode: 401,
                details: 'Please provide a valid authentication token'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: true,
                message: 'Subscription upgrade required',
                statusCode: 403,
                details: 'This feature requires Pro or Elite plan'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Usage limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: true,
                message: 'Usage limit exceeded',
                statusCode: 429,
                details: 'Monthly limit of 10 workouts reached'
              }
            }
          }
        },
        ValidationError: {
          description: 'Invalid input',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: true,
                message: 'Validation failed',
                statusCode: 400,
                details: 'Required field missing: fitnessLevel'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'User',
        description: 'User profile and account management'
      },
      {
        name: 'WOD',
        description: 'Workout generation and AI features'
      },
      {
        name: 'Subscription',
        description: 'Subscription plans and billing'
      },
      {
        name: 'Health',
        description: 'API health and status checks'
      }
    ]
  },
  apis: ['./src/routes/*.js', './server.js'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #e74c3c; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
  `,
  customSiteTitle: 'CrossFit WOD AI API Documentation',
  customfavIcon: '/assets/favicon.ico'
};

export default {
  swaggerSpec,
  swaggerOptions
};