import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get()
  async getSyncData(@Request() req: any) {
    return this.syncService.getSyncData(req.user._id);
  }

  @Post()
  async updateSyncData(@Request() req: any, @Body() body: { data: Record<string, any> }) {
    return this.syncService.updateSyncData(req.user._id, body.data);
  }
}
