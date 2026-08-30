/**
 * Seeder script to upload courses, modules, and lesson blocks directly to Supabase
 * Usage: npx tsx scripts/seed_to_supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { QUANTUM_COURSES } from '../components/learning/coursesData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️ Supabase credentials missing (NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY / ANON_KEY).');
  console.log('To seed Supabase directly, run:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=key npx tsx scripts/seed_to_supabase.ts');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🚀 Starting Supabase curriculum seed...');

  // 1. Seed Courses
  for (let cIdx = 0; cIdx < QUANTUM_COURSES.length; cIdx++) {
    const course = QUANTUM_COURSES[cIdx];
    const { error: courseErr } = await supabase.from('courses').upsert({
      id: course.id,
      number: course.number,
      title: course.title,
      code: course.code,
      level: course.level,
      category: course.category,
      description: course.description,
      lessons_count: course.lessonsCount,
      completed_lessons_count: course.completedLessonsCount,
      status: course.status,
      badge_bg: course.badgeBg,
      badge_border: course.badgeBorder,
      badge_text: course.badgeText,
      card_bg: course.cardBg,
      card_border: course.cardBorder,
      accent_color: course.accentColor,
      linked_challenge_id: course.linkedChallengeId || null,
      order_index: cIdx,
    });

    if (courseErr) {
      console.error(`Error inserting course ${course.id}:`, courseErr.message);
    } else {
      console.log(`✓ Course seeded: [${course.code}] ${course.title}`);
    }

    // 2. Seed Modules for this Course
    for (let mIdx = 0; mIdx < course.lessons.length; mIdx++) {
      const lesson = course.lessons[mIdx];
      const { error: moduleErr } = await supabase.from('modules').upsert({
        id: lesson.id,
        course_id: course.id,
        number: lesson.number,
        title: lesson.title,
        subtitle: lesson.subtitle || null,
        duration: lesson.duration,
        level: lesson.level,
        order_index: mIdx,
        concept_heading: lesson.conceptHeading,
        starter_qasm: lesson.starterQasm,
        available_gates: lesson.availableGates,
        num_qubits: lesson.numQubits,
        key_insight: lesson.keyInsight || null,
        real_world_application: lesson.realWorldApplication || null,
        historical_note: lesson.historicalNote || null,
        illustration_url: lesson.illustrationUrl || null,
        illustration_caption: lesson.illustrationCaption || null,
      });

      if (moduleErr) {
        console.error(`  Error inserting module ${lesson.id}:`, moduleErr.message);
      } else {
        console.log(`  ✓ Module seeded: ${lesson.title}`);
      }

      // 3. Seed Granular Lesson Blocks
      let blockIndex = 0;

      // Theory Block
      if (lesson.conceptBody && lesson.conceptBody.length > 0) {
        await supabase.from('lesson_blocks').insert({
          module_id: lesson.id,
          block_type: 'theory',
          order_index: blockIndex++,
          content: {
            heading: lesson.conceptHeading,
            paragraphs: lesson.conceptBody,
            comparison: lesson.calloutComparison || null,
            key_insight: lesson.keyInsight || null,
            real_world_application: lesson.realWorldApplication || null,
            historical_note: lesson.historicalNote || null,
            illustration_url: lesson.illustrationUrl || null,
            illustration_caption: lesson.illustrationCaption || null,
          },
        });
      }

      // Interactive Block
      if (lesson.interactiveExample) {
        await supabase.from('lesson_blocks').insert({
          module_id: lesson.id,
          block_type: 'interactive',
          order_index: blockIndex++,
          content: lesson.interactiveExample,
        });
      }

      // Simulation Block
      await supabase.from('lesson_blocks').insert({
        module_id: lesson.id,
        block_type: 'simulation',
        order_index: blockIndex++,
        content: {
          starter_qasm: lesson.starterQasm,
          starter_circuit_gates: lesson.starterCircuitGates || [],
          available_gates: lesson.availableGates,
          num_qubits: lesson.numQubits,
        },
      });

      // AI Question Block
      if (lesson.hints && lesson.hints.length > 0) {
        await supabase.from('lesson_blocks').insert({
          module_id: lesson.id,
          block_type: 'ai_question',
          order_index: blockIndex++,
          content: {
            prompt: `What is the key transformation taking place in lesson ${lesson.title}?`,
            hints: lesson.hints,
            concept_summary: lesson.keyInsight || lesson.subtitle || lesson.conceptHeading,
          },
        });
      }

      // Challenge Block
      if (lesson.challenge) {
        await supabase.from('lesson_blocks').insert({
          module_id: lesson.id,
          block_type: 'challenge',
          order_index: blockIndex++,
          content: lesson.challenge,
        });
      }
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
});
