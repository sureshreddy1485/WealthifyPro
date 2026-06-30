import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sync, SyncDocument } from './schemas/sync.schema';

@Injectable()
export class SyncService {
  constructor(@InjectModel(Sync.name) private syncModel: Model<SyncDocument>) {}

  async getSyncData(userId: string) {
    let syncDoc = await this.syncModel.findOne({ userId }).exec();
    if (!syncDoc) {
      syncDoc = await this.syncModel.create({ userId, data: {} });
    }
    return syncDoc;
  }

  async updateSyncData(userId: string, data: Record<string, any>) {
    return this.syncModel.findOneAndUpdate(
      { userId },
      { data, lastSyncedAt: new Date() },
      { new: true, upsert: true }
    ).exec();
  }
}
