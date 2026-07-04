import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(studentId: string) {
    const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, status: 'ACTIVATED' },
      include: { course: true },
      orderBy: { activatedAt: 'asc' },
    });

    return {
      id: student.id,
      email: student.email,
      fullName: student.fullName,
      courses: enrollments.map((e) => ({
        id: e.course.id,
        subject: e.course.subject,
        yearRange: e.course.yearRange,
        enrolledAt: e.activatedAt,
      })),
    };
  }

  private async assertEnrolled(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, courseId, status: 'ACTIVATED' },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }
  }

  async getLessonsForCourse(studentId: string, courseId: string) {
    await this.assertEnrolled(studentId, courseId);

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { progress: { where: { studentId } } },
    });

    return lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      completed: lesson.progress.length > 0,
    }));
  }

  async getLesson(studentId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { progress: { where: { studentId } } },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.assertEnrolled(studentId, lesson.courseId);

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      courseId: lesson.courseId,
      completed: lesson.progress.length > 0,
    };
  }

  async completeLesson(studentId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.assertEnrolled(studentId, lesson.courseId);

    await this.prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      update: {},
      create: { studentId, lessonId },
    });

    return { completed: true };
  }
}
