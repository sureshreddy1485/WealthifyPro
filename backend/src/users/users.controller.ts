import { Controller, Get, Put, Post, Delete, Body, UseGuards, Request, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { v2 as cloudinary } from 'cloudinary';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() updateDto: { name?: string; profilePictureUrl?: string }) {
    
    if (updateDto.profilePictureUrl && updateDto.profilePictureUrl.startsWith('data:image')) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      try {
        // Delete old image if it exists
        if (req.user.profilePictureUrl && req.user.profilePictureUrl.includes('cloudinary.com')) {
          const parts = req.user.profilePictureUrl.split('/');
          const filename = parts.pop();
          const folder = parts.pop();
          if (filename && folder) {
            const publicId = `${folder}/${filename.split('.')[0]}`;
            await cloudinary.uploader.destroy(publicId);
          }
        }

        const uploadResponse = await cloudinary.uploader.upload(updateDto.profilePictureUrl, {
          folder: 'wealthify_profiles',
        });
        updateDto.profilePictureUrl = uploadResponse.secure_url;
      } catch (error: any) {
        console.error('Cloudinary error:', error);
        throw new Error('Failed to upload image to Cloudinary: ' + (error.message || error));
      }
    }

    const updatedUser = await this.usersService.update(req.user._id, updateDto);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return {
      id: updatedUser._id,
      emailOrPhone: updatedUser.emailOrPhone,
      name: updatedUser.name,
      profilePictureUrl: updatedUser.profilePictureUrl
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('profile')
  async deleteAccount(@Request() req: any) {
    if (req.user.profilePictureUrl && req.user.profilePictureUrl.includes('cloudinary.com')) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      try {
        const parts = req.user.profilePictureUrl.split('/');
        const filename = parts.pop();
        const folder = parts.pop();
        if (filename && folder) {
          const publicId = `${folder}/${filename.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (e) {
        console.error('Failed to delete user profile picture from cloudinary:', e);
      }
    }
    await this.usersService.delete(req.user._id);
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('devices')
  async getDevices(@Request() req: any) {
    const user = await this.usersService.findById(req.user._id);
    if (!user) throw new NotFoundException('User not found');
    return { devices: user.devices || [] };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('devices/revoke')
  async revokeDevice(@Request() req: any, @Body() body: { deviceId: string; secKey: string }) {
    const user = await this.usersService.findById(req.user._id);
    if (!user) throw new NotFoundException('User not found');

    if (user.securityKey !== body.secKey) {
      throw new UnauthorizedException('Invalid security key');
    }

    user.devices = user.devices.filter(d => {
      const id = d.includes('::') ? d.split('::')[0] : d;
      return id !== body.deviceId;
    });
    await this.usersService.update(req.user._id, { devices: user.devices });
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('devices/revoke-all')
  async revokeAllOtherDevices(@Request() req: any, @Body() body: { currentDeviceId: string; secKey: string }) {
    const user = await this.usersService.findById(req.user._id);
    if (!user) throw new NotFoundException('User not found');

    if (user.securityKey !== body.secKey) {
      throw new UnauthorizedException('Invalid security key');
    }

    user.devices = user.devices.filter(d => {
      const id = d.includes('::') ? d.split('::')[0] : d;
      return id === body.currentDeviceId;
    });
    
    await this.usersService.update(req.user._id, { devices: user.devices });
    return { success: true };
  }
}
