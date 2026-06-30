import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { Sync, SyncSchema } from './schemas/sync.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Sync.name, schema: SyncSchema }])],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
