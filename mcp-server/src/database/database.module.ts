import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchemaService } from './schema.service';
import { QueryValidator } from './query.validator';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST', 'localhost'),
                port: configService.get<number>('DB_PORT', 5432),
                username: configService.get<string>('DB_USER', 'postgres'),
                password: configService.get<string>('DB_PASS', 'postgres'),
                database: configService.get<string>('DB_NAME', 'postgres'),
                autoLoadEntities: true, // Automatically load entities imported by other modules (MemoryModule)
                // Read-only user logic and explicit synchronization disabled in prod, but enables tests
                synchronize: configService.get<string>('NODE_ENV') !== 'production',
                logging: ['query', 'error'],
            }),
        }),
    ],
    providers: [SchemaService, QueryValidator],
    exports: [SchemaService, QueryValidator],
})
export class DatabaseModule { }
