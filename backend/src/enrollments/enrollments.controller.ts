import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ActivateEnrollmentDto } from './dto/activate-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get(':token')
  getByToken(@Param('token') token: string) {
    return this.enrollmentsService.getByToken(token);
  }

  @Post(':token/activate')
  activate(@Param('token') token: string, @Body() dto: ActivateEnrollmentDto) {
    return this.enrollmentsService.activate(token, dto);
  }
}
