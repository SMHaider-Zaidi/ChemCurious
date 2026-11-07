import { NextResponse } from 'next/server';
import { Chapter, Question, sequelize, ensureDbSynced } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevelParam = searchParams.get('class_level') || searchParams.get('class');
  const chapterId = searchParams.get('chapter_id');

  try {
    await ensureDbSynced();

    // 1. Fetch specific chapter questions if chapter_id is supplied
    if (chapterId) {
      const questions = await Question.findAll({
        where: { chapterId: Number(chapterId) },
        raw: true,
      });

      // Map DB schema to match UI expectations
      const formattedQuestions = questions.map((q: any) => {
        // Map "A", "B", "C", "D" to index 0, 1, 2, 3
        const correctLetter = String(q.correctOption || q.correct_option || 'A').toUpperCase();
        const correctIdx = ['A', 'B', 'C', 'D'].indexOf(correctLetter);

        return {
          id: String(q.id),
          type: 'multiple-choice',
          question: q.questionText || q.question_text || q.question,
          options: [
            q.optionA || q.option_a,
            q.optionB || q.option_b,
            q.optionC || q.option_c,
            q.optionD || q.option_d,
          ],
          correctAnswer: correctIdx !== -1 ? correctIdx : 0,
          explanation: q.explanation,
          difficulty: q.difficulty || 'medium',
          topic: q.topic || 'General',
        };
      });

      return NextResponse.json({ questions: formattedQuestions });
    }

    // 2. Query chapters with question counts using Sequelize
    let whereCondition: any = {};
    if (classLevelParam) {
      const match = String(classLevelParam).match(/\d+/);
      if (match) {
        whereCondition.class = parseInt(match[0], 10);
      } else {
        whereCondition.class = classLevelParam;
      }
    }

    const chapters = await Chapter.findAll({
      where: whereCondition,
      attributes: [
        'id',
        ['chapter_number', 'chapter_number'],
        ['chapter_title', 'title'],
        ['class', 'class_level'],
        [
          sequelize.fn('COUNT', sequelize.col('questions.id')),
          'question_count',
        ],
      ],
      include: [
        {
          model: Question,
          as: 'questions',
          attributes: [], // don't load individual question rows here
        },
      ],
      group: ['Chapter.id'],
      order: [
        ['class', 'ASC'],
        ['chapter_number', 'ASC'],
      ],
      raw: true,
    });

    return NextResponse.json({ chapters });
  } catch (error: any) {
    console.error('Database Error in Quizzes API:', error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}