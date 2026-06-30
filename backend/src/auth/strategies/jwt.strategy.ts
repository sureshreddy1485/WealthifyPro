import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  emailOrPhone: string;
  deviceId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
    });
  }

  async validate(payload: JwtPayload) {
    // payload.sub is the user ID. We return it so it's attached to the request (req.user)
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    
    // Multi-device check
    const devices = user.devices || [];
    const isActiveDevice = devices.some(d => {
      const id = d.includes('::') ? d.split('::')[0] : d;
      return id === payload.deviceId;
    });
    if (!isActiveDevice) {
      throw new UnauthorizedException('Session expired due to login from another device. Maximum 3 devices allowed.');
    }
    
    return user;
  }
}
