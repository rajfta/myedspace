import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  issueToken(studentId: string, email: string): string {
    return this.jwtService.sign({ sub: studentId, email });
  }

  async login(email: string, password: string) {
    const student = await this.prisma.student.findUnique({ where: { email } });
    if (!student) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, student.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      accessToken: this.issueToken(student.id, student.email),
      student: { id: student.id, email: student.email, fullName: student.fullName },
    };
  }
}
