import { NextResponse } from 'next/server';
import { Chapter, Question, ensureDbSynced, sequelize } from '@/lib/db';
import { Op } from 'sequelize';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevelParam = searchParams.get('class_level') || searchParams.get('class');
  const chapterId = searchParams.get('chapter_id');

  try {
    await ensureDbSynced();

    // 1. Fetch specific chapter questions if chapter_id is supplied
    if (chapterId) {
      const questionsWhere: any = {
        chapterId: Number(chapterId),
        status: { [Op.ne]: 'draft' },
      };

      const questions = await Question.findAll({
        where: questionsWhere,
        order: [['id', 'ASC']],
        raw: true,
      });

      // Map DB schema to match UI expectations
      const formattedQuestions = questions.map((q: any) => {
        const correctLetter = String(q.correctOption || q.correct_option || 'A').toUpperCase();
        const correctIdx = ['A', 'B', 'C', 'D'].indexOf(correctLetter);

        return {
          id: String(q.id),
          type: 'multiple-choice' as const,
          question: q.questionText || q.question_text || q.question || '',
          options: [
            q.optionA || q.option_a || '',
            q.optionB || q.option_b || '',
            q.optionC || q.option_c || '',
            q.optionD || q.option_d || '',
          ],
          correctAnswer: correctIdx !== -1 ? correctIdx : 0,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
          topic: q.topic || 'General',
        };
      });

      return NextResponse.json({ questions: formattedQuestions });
    }

    // 2. Query chapters with question counts
    const whereCondition: any = {
      status: { [Op.ne]: 'draft' },
    };

    if (classLevelParam) {
      whereCondition.class = Number(classLevelParam) || String(classLevelParam);
    }

    const chapters = await Chapter.findAll({
      where: whereCondition,
      order: [
        ['class', 'ASC'],
        ['chapterNumber', 'ASC'],
        ['id', 'ASC'],
      ],
      raw: true,
    });

    // Calculate question counts safely without vulnerable join aliases
    const chapterIds = chapters.map((c: any) => c.id);
    const countMap = new Map<number, number>();

    if (chapterIds.length > 0) {
      const countsWhere: any = {
        chapterId: chapterIds,
        status: { [Op.ne]: 'draft' },
      };

      const counts = await Question.findAll({
        where: countsWhere,
        attributes: [
          'chapterId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cnt'],
        ],
        group: ['chapterId'],
        raw: true,
      });

      for (const item of counts as any[]) {
        countMap.set(Number(item.chapterId), Number(item.cnt || 0));
      }
    }

    const formattedChapters = chapters.map((c: any) => ({
      id: c.id,
      chapter_number: c.chapterNumber ?? c.chapter_number ?? 1,
      title: c.chapterTitle ?? c.title ?? 'Untitled Chapter',
      class_level: c.class,
      class: c.class,
      question_count: countMap.get(c.id) || 0,
    }));

    return NextResponse.json({ chapters: formattedChapters });
  } catch (error: any) {
    console.error('Database Error in Quizzes API:', error);
    return NextResponse.json({ error: error?.message || 'Database query failed' }, { status: 500 });
  }
}
