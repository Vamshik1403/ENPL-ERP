import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService
  ) {}

  async register(data: any) {
    const { username, password, fullName, email, userType, department } = data;

    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) throw new UnauthorizedException('Username already exists');

    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashed,
        fullName,
        email,
        userType,
        department
      },
    });

    return { message: 'User created', user };
  }

async getAllUsers() {
  return this.prisma.user.findMany({
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      userType: true,
      department: true,
      createdAt: true
    }
  });
}

async getUserById(id: number) {
  return this.prisma.user.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      userType: true,
      department: true,
      createdAt: true,
    },
  });
}


async updateUser(id: number, data: any) {
  const { password, ...rest } = data;

  let updateData = rest;

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  return this.prisma.user.update({
    where: { id: Number(id) },
    data: updateData,
  });
}

async deleteUser(id: number) {
  return this.prisma.user.delete({
    where: { id: Number(id) }
  });
}


  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    return user;
  }

 async login(user: any) {
  const payload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    userType: user.userType,
    department: user.department
  };

  return { 
    access_token: this.jwt.sign(payload),
    id: user.id,
    username: user.username,
    email: user.email,
    userType: user.userType,
    fullName: user.fullName
  };
}

}
