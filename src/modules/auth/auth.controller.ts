import { Body, Controller, Post, Get, Param, Query, Req } from '@nestjs/common';
import { LoginDto } from './dtos/login.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { UploadFileDto } from './dtos/upload-file.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser, User } from 'src/common/decorators/current-user';
import { UserService } from '../users/user.service';
import { ResetPasswordDto } from '../users/dto/reset-password.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly userService: UserService) { }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @Post('upload-single')
  @FormDataRequest()
  async uploadSingleFile(@Body() uploadFileDto: UploadFileDto) {
    return this.authService.uploadFile(uploadFileDto);
  }

  @Post('update-password/:id')
  async updatePassword(@Param('id') id: number, @Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.updatePassword(id, resetPasswordDto);
  }

  @Post('request-reset-password')
  async requestResetPassword(@Body('email') email: string) {
    return this.userService.requestResetPassword(email);
  }

  @Post('reset-password')
  async resetPasswordWithToken(@Query('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.resetPasswordWithToken(token, resetPasswordDto.new_password);
  }
}
