import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedStudent } from '../auth/current-student.decorator';
import { CurrentStudent } from '../auth/current-student.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LmsService } from './lms.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get('me')
  getDashboard(@CurrentStudent() student: AuthenticatedStudent) {
    return this.lmsService.getDashboard(student.id);
  }

  @Get('courses/:courseId/lessons')
  getLessons(@CurrentStudent() student: AuthenticatedStudent, @Param('courseId') courseId: string) {
    return this.lmsService.getLessonsForCourse(student.id, courseId);
  }

  @Get('lessons/:lessonId')
  getLesson(@CurrentStudent() student: AuthenticatedStudent, @Param('lessonId') lessonId: string) {
    return this.lmsService.getLesson(student.id, lessonId);
  }

  @Post('lessons/:lessonId/complete')
  completeLesson(
    @CurrentStudent() student: AuthenticatedStudent,
    @Param('lessonId') lessonId: string,
  ) {
    return this.lmsService.completeLesson(student.id, lessonId);
  }
}
