import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const COURSES = [
  {
    subject: 'Maths',
    yearRange: 'Year 5 → 13',
    price: 19900,
    lessons: [
      {
        title: 'Numbers and the Number System',
        description: 'Place value, fractions, decimals and percentages.',
        content:
          'In this lesson we explore how numbers are represented and manipulated, covering place value, fractions, decimals and percentages with worked examples.',
      },
      {
        title: 'Algebraic Expressions',
        description: 'Introduction to variables, expressions and simple equations.',
        content:
          'This lesson introduces algebraic notation, simplifying expressions, and solving simple linear equations step by step.',
      },
      {
        title: 'Geometry Basics',
        description: 'Angles, shapes and their properties.',
        content:
          'Learn to identify and classify 2D and 3D shapes, calculate angles, and understand basic geometric properties.',
      },
      {
        title: 'Data and Statistics',
        description: 'Collecting, representing and interpreting data.',
        content:
          'This lesson covers how to build bar charts, pie charts and calculate the mean, median and mode of a data set.',
      },
    ],
  },
  {
    subject: 'English',
    yearRange: 'Year 5 → 13',
    price: 19900,
    lessons: [
      {
        title: 'Reading Comprehension',
        description: 'Techniques for understanding and analysing texts.',
        content:
          'This lesson covers strategies for close reading, identifying themes, and answering comprehension questions with evidence from the text.',
      },
      {
        title: 'Creative Writing',
        description: 'Structuring narratives and building descriptive language.',
        content:
          'Learn how to plan a short story, build tension, and use descriptive language to engage a reader.',
      },
      {
        title: 'Grammar and Punctuation',
        description: 'Core grammar rules and punctuation conventions.',
        content:
          'This lesson reviews sentence structure, common grammar pitfalls, and correct use of punctuation.',
      },
      {
        title: 'Persuasive Writing',
        description: 'Building an argument and writing to persuade.',
        content:
          'Learn how to structure a persuasive essay, use rhetorical devices, and anticipate counter-arguments.',
      },
    ],
  },
  {
    subject: 'Science',
    yearRange: 'Year 5 → 11',
    price: 19900,
    lessons: [
      {
        title: 'Introduction to Cells',
        description: 'The building blocks of living organisms.',
        content:
          'This lesson introduces cell structure, the difference between plant and animal cells, and basic cell functions.',
      },
      {
        title: 'Forces and Motion',
        description: "Newton's laws and everyday examples of force.",
        content:
          "Learn about the basic forces acting on objects, and how Newton's laws explain everyday motion.",
      },
      {
        title: 'The Periodic Table',
        description: 'Elements, groups and periods.',
        content:
          "This lesson introduces how the periodic table is organised and what it tells us about an element's properties.",
      },
      {
        title: 'Ecosystems',
        description: 'How living organisms interact with their environment.',
        content: 'Explore food chains, food webs, and how energy flows through an ecosystem.',
      },
    ],
  },
];

async function main() {
  for (const courseData of COURSES) {
    const { lessons, ...courseFields } = courseData;

    const existing = await prisma.course.findFirst({
      where: { subject: courseFields.subject },
    });

    const course =
      existing ??
      (await prisma.course.create({
        data: courseFields,
      }));

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const existingLesson = await prisma.lesson.findFirst({
        where: { courseId: course.id, title: lesson.title },
      });
      if (!existingLesson) {
        await prisma.lesson.create({
          data: { ...lesson, order: i + 1, courseId: course.id },
        });
      }
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
