import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaClient } from '../src/generated/prisma/client';

describe('Core user journey (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let mathsCourseId: string;
  let scienceCourseId: string;

  const uniqueEmail = (label: string) => `${label}-${Date.now()}-${Math.random()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    const maths = await prisma.course.findFirstOrThrow({ where: { subject: 'Maths' } });
    const science = await prisma.course.findFirstOrThrow({ where: { subject: 'Science' } });
    mathsCourseId = maths.id;
    scienceCourseId = science.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('GET /api/courses lists the seeded courses', async () => {
    const res = await request(app.getHttpServer()).get('/api/courses').expect(200);
    const subjects = res.body.map((c: { subject: string }) => c.subject);
    expect(subjects).toEqual(expect.arrayContaining(['Maths', 'English', 'Science']));
  });

  it('walks the full purchase -> onboarding -> LMS journey', async () => {
    const studentEmail = uniqueEmail('student');

    // 1. Parent completes mock checkout
    const orderRes = await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        courseId: mathsCourseId,
        parentEmail: uniqueEmail('parent'),
        studentEmail,
        cardNumber: '4242424242424242',
        cardExpiry: '12/29',
        cardCvc: '123',
      })
      .expect(201);

    const { invitationToken } = orderRes.body;
    expect(invitationToken).toBeDefined();

    // 2. Invitation resolves to a pending enrollment for that course
    const enrollmentRes = await request(app.getHttpServer())
      .get(`/api/enrollments/${invitationToken}`)
      .expect(200);
    expect(enrollmentRes.body.status).toBe('PENDING');
    expect(enrollmentRes.body.course.subject).toBe('Maths');

    // 3. Student completes onboarding and activates their account
    const activateRes = await request(app.getHttpServer())
      .post(`/api/enrollments/${invitationToken}/activate`)
      .send({ fullName: 'Test Student', password: 'password123', confirmPassword: 'password123' })
      .expect(201);

    const { accessToken } = activateRes.body;
    expect(accessToken).toBeDefined();

    // Re-using the same invitation token should now be rejected
    await request(app.getHttpServer())
      .post(`/api/enrollments/${invitationToken}/activate`)
      .send({ fullName: 'Test Student', password: 'password123', confirmPassword: 'password123' })
      .expect(409);

    // 4. Authenticated dashboard shows the purchased course
    const meRes = await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(meRes.body.courses.map((c: { subject: string }) => c.subject)).toContain('Maths');

    // 5. LMS lessons are reachable for the enrolled course
    const lessonsRes = await request(app.getHttpServer())
      .get(`/api/courses/${mathsCourseId}/lessons`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(lessonsRes.body.length).toBeGreaterThan(0);
    expect(lessonsRes.body[0].completed).toBe(false);

    // 6. Without a token, LMS routes are unauthorized
    await request(app.getHttpServer()).get(`/api/courses/${mathsCourseId}/lessons`).expect(401);

    // 7. With a token but no enrollment in that course, access is forbidden
    await request(app.getHttpServer())
      .get(`/api/courses/${scienceCourseId}/lessons`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    // 8. Student can view and complete a lesson
    const lessonId = lessonsRes.body[0].id;
    await request(app.getHttpServer())
      .get(`/api/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/lessons/${lessonId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const lessonAfter = await request(app.getHttpServer())
      .get(`/api/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(lessonAfter.body.completed).toBe(true);

    // 9. Student can log back in with the password they set
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: studentEmail, password: 'password123' })
      .expect(201);
    expect(loginRes.body.accessToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: studentEmail, password: 'wrong-password' })
      .expect(401);
  });
});
