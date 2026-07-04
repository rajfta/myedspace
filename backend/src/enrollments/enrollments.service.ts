import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ActivateEnrollmentDto } from './dto/activate-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  private async findEnrollmentOrThrow(token: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { invitationToken: token },
      include: { course: true },
    });
    if (!enrollment) {
      throw new NotFoundException('Invitation not found');
    }
    return enrollment;
  }

  async getByToken(token: string) {
    const enrollment = await this.findEnrollmentOrThrow(token);
    const existingStudent = await this.prisma.student.findUnique({
      where: { email: enrollment.studentEmail },
    });

    return {
      status: enrollment.status,
      studentEmail: enrollment.studentEmail,
      studentAlreadyActive: Boolean(existingStudent) && enrollment.status === 'PENDING',
      course: {
        id: enrollment.course.id,
        subject: enrollment.course.subject,
        yearRange: enrollment.course.yearRange,
      },
    };
  }

  async activate(token: string, dto: ActivateEnrollmentDto) {
    const enrollment = await this.findEnrollmentOrThrow(token);

    if (enrollment.status === 'ACTIVATED') {
      throw new ConflictException('This invitation has already been used');
    }

    const existingStudent = await this.prisma.student.findUnique({
      where: { email: enrollment.studentEmail },
    });

    let studentId: string;

    if (existingStudent) {
      // Same student email onboarding a second course purchase - just link it,
      // the invitation token already proves the parent authorized this course.
      studentId = existingStudent.id;
    } else {
      if (!dto.fullName || !dto.password || !dto.confirmPassword) {
        throw new BadRequestException('Full name and password are required');
      }
      if (dto.password !== dto.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const student = await this.prisma.student.create({
        data: {
          email: enrollment.studentEmail,
          fullName: dto.fullName,
          passwordHash,
        },
      });
      studentId = student.id;
    }

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { studentId, status: 'ACTIVATED', activatedAt: new Date() },
    });

    const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } });

    return {
      accessToken: this.authService.issueToken(student.id, student.email),
      student: { id: student.id, email: student.email, fullName: student.fullName },
    };
  }
}
