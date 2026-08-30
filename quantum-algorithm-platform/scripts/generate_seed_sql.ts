import * as fs from 'fs';
import * as path from 'path';
import { QUANTUM_COURSES } from '../components/learning/coursesData';

function escapeSql(str: string | undefined | null): string {
  if (str === undefined || str === null) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function escapeJson(obj: any): string {
  if (obj === undefined || obj === null) return "'{}'::jsonb";
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

function generateSeedSql(): string {
  const lines: string[] = [
    '--',
    '-- qbit.labs: Seed SQL for Quantum Courses, Modules, and Lesson Blocks',
    '--',
    'BEGIN;',
    '',
    '-- Clean existing records',
    'TRUNCATE TABLE public.lesson_blocks CASCADE;',
    'TRUNCATE TABLE public.modules CASCADE;',
    'TRUNCATE TABLE public.courses CASCADE;',
    '',
  ];

  // 1. Insert Courses
  lines.push('-- 1. Insert Courses');
  QUANTUM_COURSES.forEach((course, cIdx) => {
    lines.push(
      `INSERT INTO public.courses (id, number, title, code, level, category, description, lessons_count, completed_lessons_count, status, badge_bg, badge_border, badge_text, card_bg, card_border, accent_color, linked_challenge_id, order_index) VALUES (${escapeSql(course.id)}, ${escapeSql(course.number)}, ${escapeSql(course.title)}, ${escapeSql(course.code)}, ${escapeSql(course.level)}, ${escapeSql(course.category)}, ${escapeSql(course.description)}, ${course.lessonsCount}, ${course.completedLessonsCount}, ${escapeSql(course.status)}, ${escapeSql(course.badgeBg)}, ${escapeSql(course.badgeBorder)}, ${escapeSql(course.badgeText)}, ${escapeSql(course.cardBg)}, ${escapeSql(course.cardBorder)}, ${escapeSql(course.accentColor)}, ${escapeSql(course.linkedChallengeId || null)}, ${cIdx});`
    );
  });
  lines.push('');

  // 2. Insert Modules
  lines.push('-- 2. Insert Modules (Lessons)');
  QUANTUM_COURSES.forEach((course) => {
    course.lessons.forEach((lesson, mIdx) => {
      lines.push(
        `INSERT INTO public.modules (id, course_id, number, title, subtitle, duration, level, order_index, concept_heading, starter_qasm, available_gates, num_qubits, key_insight, real_world_application, historical_note, illustration_url, illustration_caption) VALUES (${escapeSql(lesson.id)}, ${escapeSql(course.id)}, ${lesson.number}, ${escapeSql(lesson.title)}, ${escapeSql(lesson.subtitle || null)}, ${escapeSql(lesson.duration)}, ${escapeSql(lesson.level)}, ${mIdx}, ${escapeSql(lesson.conceptHeading)}, ${escapeSql(lesson.starterQasm)}, ${escapeJson(lesson.availableGates)}, ${lesson.numQubits}, ${escapeSql(lesson.keyInsight || null)}, ${escapeSql(lesson.realWorldApplication || null)}, ${escapeSql(lesson.historicalNote || null)}, ${escapeSql(lesson.illustrationUrl || null)}, ${escapeSql(lesson.illustrationCaption || null)});`
      );
    });
  });
  lines.push('');

  // 3. Insert Lesson Blocks
  lines.push('-- 3. Insert Granular Lesson Blocks (theory, simulation, challenge, interactive, prediction, ai_question)');
  QUANTUM_COURSES.forEach((course) => {
    course.lessons.forEach((lesson) => {
      let blockIndex = 0;

      // (a) Theory Block
      if (lesson.conceptBody && lesson.conceptBody.length > 0) {
        const theoryContent = {
          heading: lesson.conceptHeading,
          paragraphs: lesson.conceptBody,
          comparison: lesson.calloutComparison || null,
          key_insight: lesson.keyInsight || null,
          real_world_application: lesson.realWorldApplication || null,
          historical_note: lesson.historicalNote || null,
          illustration_url: lesson.illustrationUrl || null,
          illustration_caption: lesson.illustrationCaption || null,
        };
        lines.push(
          `INSERT INTO public.lesson_blocks (module_id, block_type, order_index, content) VALUES (${escapeSql(lesson.id)}, 'theory', ${blockIndex++}, ${escapeJson(theoryContent)});`
        );
      }

      // (b) Interactive / Prediction Block (if example provided)
      if (lesson.interactiveExample) {
        lines.push(
          `INSERT INTO public.lesson_blocks (module_id, block_type, order_index, content) VALUES (${escapeSql(lesson.id)}, 'interactive', ${blockIndex++}, ${escapeJson(lesson.interactiveExample)});`
        );
      }

      // (c) Simulation Block (circuit workspace)
      const simulationContent = {
        starter_qasm: lesson.starterQasm,
        starter_circuit_gates: lesson.starterCircuitGates || [],
        available_gates: lesson.availableGates,
        num_qubits: lesson.numQubits,
      };
      lines.push(
        `INSERT INTO public.lesson_blocks (module_id, block_type, order_index, content) VALUES (${escapeSql(lesson.id)}, 'simulation', ${blockIndex++}, ${escapeJson(simulationContent)});`
      );

      // (d) AI Question / Hints Block
      if (lesson.hints && lesson.hints.length > 0) {
        const aiQuestionContent = {
          prompt: `What is the key transformation taking place in lesson ${lesson.title}?`,
          hints: lesson.hints,
          concept_summary: lesson.keyInsight || lesson.subtitle || lesson.conceptHeading,
        };
        lines.push(
          `INSERT INTO public.lesson_blocks (module_id, block_type, order_index, content) VALUES (${escapeSql(lesson.id)}, 'ai_question', ${blockIndex++}, ${escapeJson(aiQuestionContent)});`
        );
      }

      // (e) Challenge Block
      if (lesson.challenge) {
        lines.push(
          `INSERT INTO public.lesson_blocks (module_id, block_type, order_index, content) VALUES (${escapeSql(lesson.id)}, 'challenge', ${blockIndex++}, ${escapeJson(lesson.challenge)});`
        );
      }
    });
  });

  lines.push('');
  lines.push('COMMIT;');
  return lines.join('\n');
}

const sql = generateSeedSql();
const outputPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
fs.writeFileSync(outputPath, sql, 'utf-8');
console.log(`Successfully generated Supabase seed SQL at: ${outputPath}`);
