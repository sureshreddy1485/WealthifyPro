import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: any) {
    const { emailOrPhone, password, name, securityKey, deviceId, deviceName } = registerDto;
    
    // Check if user exists
    const existingUser = await this.usersService.findByEmailOrPhone(emailOrPhone);
    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    if (!deviceId) {
      throw new UnauthorizedException('Device ID is required');
    }

    if (!securityKey) {
      throw new UnauthorizedException('Security key is mandatory for verification');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.usersService.create({
      emailOrPhone,
      passwordHash,
      name,
      securityKey,
      devices: [`${deviceId}::${deviceName || 'Unknown Device'}`]
    });

    return this.generateTokens(user, deviceId);
  }

  async login(loginDto: any) {
    const { emailOrPhone, password, securityKey, deviceId, deviceName } = loginDto;
    
    if (!deviceId) {
      throw new UnauthorizedException('Device ID is required');
    }
    
    const user = await this.usersService.findByEmailOrPhone(emailOrPhone);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!securityKey) {
      throw new UnauthorizedException('Security key is mandatory for verification');
    }

    if (user.securityKey !== securityKey) {
       throw new UnauthorizedException('Invalid security key');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Manage devices
    let devices = user.devices || [];
    // Filter out old entry for this device if exists
    devices = devices.filter(d => {
      const id = d.includes('::') ? d.split('::')[0] : d;
      return id !== deviceId;
    });

    devices.push(`${deviceId}::${deviceName || 'Unknown Device'}`);
    if (devices.length > 3) {
      devices.shift(); // Kick out oldest device
    }
    await this.usersService.update(user._id as unknown as string, { devices });

    return this.generateTokens(user, deviceId);
  }

  private generateTokens(user: any, deviceId: string) {
    const payload = { sub: user._id, emailOrPhone: user.emailOrPhone, deviceId };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id,
        emailOrPhone: user.emailOrPhone,
        name: user.name,
        profilePictureUrl: user.profilePictureUrl
      }
    };
  }
}
