import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SyncDocument = Sync & Document;

@Schema({ timestamps: true })
export class Sync {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: string;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @Prop({ default: Date.now })
  lastSyncedAt: Date;
}

export const SyncSchema = SchemaFactory.createForClass(Sync);
