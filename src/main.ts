import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe, VersioningType } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';

dotenv.config();

initializeTransactionalContext();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable WebSocket support
  app.enableShutdownHooks();

  // app.use(bodyParser.json({ limit: '50mb' }));
  // app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (validationErrors = []) => {
        const errors = {};

        const processValidationError = (error) => {
          if (error.children && error.children.length > 0) {
            // Handle nested objects/arrays
            if (error.property === 'charges' || error.property === 'move_ins_documents' || error.property === 'property_documents') {
              // Special handling for array fields
              return error.children.map((child, index) => {
                const itemErrors = {};
                if (child.children && child.children.length > 0) {
                  child.children.forEach((itemChild) => {
                    itemErrors[itemChild.property] = Object.values(itemChild.constraints || {});
                  });
                } else if (child.constraints) {
                  // Handle direct constraints on array items
                  itemErrors[child.property] = Object.values(child.constraints);
                }
                return itemErrors;
              });
            } else {
              // Handle other nested objects
              const nestedErrors = {};
              if (error.children && error.children.length > 0) {
                error.children.forEach((child) => {
                  if (child.children && child.children.length > 0) {
                    nestedErrors[child.property] = child.children.map((item) => {
                      const itemErrors = {};
                      if (item.children && item.children.length > 0) {
                        item.children.forEach((itemChild) => {
                          itemErrors[itemChild.property] = Object.values(itemChild.constraints || {});
                        });
                      } else if (item.constraints) {
                        itemErrors[item.property] = Object.values(item.constraints);
                      }
                      return itemErrors;
                    });
                  } else {
                    nestedErrors[child.property] = Object.values(child.constraints || {});
                  }
                });
              }
              return nestedErrors;
            }
          } else {
            // Handle top-level properties
            return Object.values(error.constraints || {});
          }
        };

        validationErrors.forEach((error) => {
          errors[error.property] = processValidationError(error);
        });
        return new UnprocessableEntityException({ errors });
      },
    }),
  );

  if (configService.get('APP_ENV') === 'local') {
    app.setGlobalPrefix('api');
  }

  // Enable CORS with default or custom options
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://mestate.must.services',
    'https://yourdomain.com', // Replace with your actual domain
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // Required for Socket.IO with credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.enableVersioning({
    type: VersioningType.URI, // Options: URI, HEADER, MEDIA_TYPE, CUSTOM
    defaultVersion: '1',
  });

  // Apply global transformation interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Must Estate API')
    .setDescription('API documentation for Must Estate backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(configService.get('APP_PORT') || 3000);
}

bootstrap();
