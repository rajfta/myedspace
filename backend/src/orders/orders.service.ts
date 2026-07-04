import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Mock checkout: the card details are never charged or stored, we just
    // "pretend" the payment succeeded and immediately generate access.
    const order = await this.prisma.order.create({
      data: {
        courseId: course.id,
        parentEmail: dto.parentEmail,
        studentEmail: dto.studentEmail,
        amount: course.price,
      },
    });

    const enrollment = await this.prisma.enrollment.create({
      data: {
        orderId: order.id,
        courseId: course.id,
        studentEmail: dto.studentEmail,
      },
    });

    return {
      orderId: order.id,
      course: { id: course.id, subject: course.subject, yearRange: course.yearRange },
      invitationToken: enrollment.invitationToken,
      invitationPath: `/onboard/${enrollment.invitationToken}`,
    };
  }
}
