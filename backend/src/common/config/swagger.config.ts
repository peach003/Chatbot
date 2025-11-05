import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from './config.service';

/**
 * Setup Swagger API documentation
 * @param app NestJS application instance
 * @param configService Configuration service
 */
export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
): void {
  // Only enable Swagger in development and staging
  if (configService.isProduction) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('SmartNZ Travel Planner API')
    .setDescription(
      'AI-powered bilingual travel planning API for New Zealand. ' +
      'Generate personalized itineraries, compare ticket prices, get restaurant recommendations, ' +
      'and more with real-time weather and traffic integration.',
    )
    .setVersion('1.0')
    .setContact(
      'SmartNZ Team',
      'https://github.com/smartnz/travel-planner',
      'support@smartnz.example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer(configService.backendUrl, 'Development Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT',
    )
    .addTag('health', 'Health check endpoints')
    .addTag('itineraries', 'Itinerary management')
    .addTag('chat', 'AI chatbot interactions')
    .addTag('attractions', 'Attractions and activities')
    .addTag('restaurants', 'Restaurant recommendations')
    .addTag('rentals', 'Car rental options')
    .addTag('weather', 'Weather and traffic information')
    .addTag('favorites', 'User favorites')
    .addTag('users', 'User management')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SmartNZ API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 36px; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  console.log(
    `📚 Swagger documentation available at: ${configService.backendUrl}/api/docs`,
  );
}
