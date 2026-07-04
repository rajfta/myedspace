import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CoursesModule } from './courses/courses.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, CoursesModule],
  controllers: [AppController],
})
export class AppModule {}
