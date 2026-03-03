import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalGuard } from './local.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Get('users/:id')
getUserById(@Param('id') id: number) {
  return this.auth.getUserById(id);
}

  @Get('users')
  getAllUsers() {
    return this.auth.getAllUsers();
  }

  @UseGuards(LocalGuard)
@Post('login')
login(@Request() req) {
  return this.auth.login(req.user);
}


  @Post('register')
  register(@Body() body: any) {
    return this.auth.register(body);
  }



  @Patch('users/:id')
  updateUser(@Param('id') id: number, @Body() body: any) {
    return this.auth.updateUser(id, body);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: number) {
    return this.auth.deleteUser(id);
  }
}
