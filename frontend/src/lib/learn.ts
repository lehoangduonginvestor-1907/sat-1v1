// Danh mục bài học /learn: thứ tự theo hai cuốn của Erica Meltzer, nội dung bài viết lại (src/content/learn).
// Luyện tập sau mỗi bài lấy câu College Board theo skill, ưu tiên đúng chủ đề (topics, gắn ở backend/lib/topics.js).

export interface LessonPractice {
  skills: string[];
  topics?: string[];
  label: string; // mô tả dạng câu sẽ gặp
}

export interface LessonMeta {
  slug: string;
  title: string;
  summary: string;
  chapter: string; // chương trong sách gốc
  pages: string;
  minutes: number;
  practice?: LessonPractice;
}

export interface Unit {
  title: string;
  lessons: LessonMeta[];
}

export interface Course {
  slug: 'grammar' | 'reading';
  title: string;
  short: string;
  description: string;
  book: string;
  units: Unit[];
}

const FSS = 'Form, Structure, and Sense';

export const COURSES: Course[] = [
  {
    slug: 'grammar',
    title: 'Writing: Grammar & Expression',
    short: 'Writing',
    description: 'Transitions, rhetorical synthesis, punctuation and grammar: every rule the Standard English Conventions and Expression of Ideas questions test.',
    book: 'The Ultimate Guide to SAT Grammar (Digital SAT edition)',
    units: [
      {
        title: 'Expression of Ideas',
        lessons: [
          {
            slug: 'transitions', title: 'Transitions', chapter: 'Chapter 1', pages: '11', minutes: 12,
            summary: 'Name the relationship between two ideas before you look at the choices.',
            practice: { skills: ['Transitions'], label: 'Transitions questions' },
          },
          {
            slug: 'rhetorical-synthesis', title: 'Rhetorical Synthesis (Notes)', chapter: 'Chapter 2', pages: '27', minutes: 9,
            summary: 'Match the goal stated in the question, not the notes.',
            practice: { skills: ['Rhetorical Synthesis'], label: 'Rhetorical Synthesis questions' },
          },
        ],
      },
      {
        title: 'Punctuation & Sentence Boundaries',
        lessons: [
          {
            slug: 'parts-of-speech', title: 'Parts of Speech Refresher', chapter: 'Parts of Speech', pages: '39', minutes: 7,
            summary: 'The vocabulary you need to talk about sentences: verbs, nouns, pronouns, prepositions, conjunctions.',
          },
          {
            slug: 'sentences-and-fragments', title: 'Sentences and Fragments', chapter: 'Chapter 3', pages: '45', minutes: 11,
            summary: 'A sentence needs a subject and a conjugated verb. Learn every disguise a fragment wears.',
            practice: { skills: [FSS, 'Boundaries'], topics: ['fragments', 'fragment-join'], label: 'questions on complete sentences, -ing / to forms and fragments' },
          },
          {
            slug: 'joining-sentences', title: 'Joining and Separating Sentences', chapter: 'Chapter 4', pages: '59', minutes: 12,
            summary: 'Period, semicolon, comma + FANBOYS, colon: the four legal ways to put two sentences together.',
            practice: { skills: ['Boundaries'], topics: ['joining'], label: 'Boundaries questions that join or separate two sentences' },
          },
          {
            slug: 'sentence-and-fragment', title: 'Joining a Sentence and a Fragment', chapter: 'Chapter 5', pages: '72', minutes: 10,
            summary: 'Commas, colons and dashes attach phrases and dependent clauses; periods and semicolons cannot.',
            practice: { skills: ['Boundaries'], topics: ['fragment-join', 'colon-dash'], label: 'Boundaries questions with dependent clauses, colons and dashes' },
          },
          {
            slug: 'nonessential-elements', title: 'Non-Essential and Essential Elements', chapter: 'Chapter 6', pages: '81', minutes: 13,
            summary: 'Extra information is set off on both sides with matching punctuation. Essential information never is.',
            practice: { skills: ['Boundaries'], topics: ['nonessential'], label: 'Boundaries questions with interrupters, appositives and names' },
          },
          {
            slug: 'commas', title: 'Other Comma Uses and Misuses', chapter: 'Chapter 7', pages: '106', minutes: 9,
            summary: 'Lists, coordinate adjectives, introductions, and the many places a comma does not belong.',
            practice: { skills: ['Boundaries'], topics: ['commas'], label: 'Boundaries questions about unnecessary or missing commas' },
          },
        ],
      },
      {
        title: 'Grammar: Form, Structure, and Sense',
        lessons: [
          {
            slug: 'verbs', title: 'Verbs: Agreement and Tense', chapter: 'Chapter 8', pages: '121', minutes: 14,
            summary: 'Find the real subject, then keep the tense consistent with the passage.',
            practice: { skills: [FSS], topics: ['verbs'], label: 'subject-verb agreement and verb tense questions' },
          },
          {
            slug: 'pronouns', title: 'Pronouns', chapter: 'Chapter 9', pages: '143', minutes: 10,
            summary: 'Every pronoun needs a clear antecedent of the same number.',
            practice: { skills: [FSS], topics: ['pronouns'], label: 'pronoun questions' },
          },
          {
            slug: 'apostrophes', title: 'Apostrophes and Possessives', chapter: 'Chapter 10', pages: '155', minutes: 8,
            summary: 'Plural or possessive, singular or plural owner, its or it’s.',
            practice: { skills: [FSS], topics: ['possessives'], label: 'possessive and plural noun questions' },
          },
          {
            slug: 'modifiers', title: 'Modifiers', chapter: 'Chapter 11', pages: '162', minutes: 9,
            summary: 'An introductory description must sit right next to the noun it describes.',
            practice: { skills: [FSS], topics: ['modifiers'], label: 'questions where you choose how to finish a sentence after a modifier' },
          },
          {
            slug: 'parallel-structure', title: 'Parallel Structure', chapter: 'Chapter 12', pages: '169', minutes: 7,
            summary: 'Items in a list or pair take the same grammatical form.',
            practice: { skills: [FSS], topics: ['modifiers', 'verbs'], label: 'Form, Structure, and Sense questions' },
          },
          {
            slug: 'word-pairs-comparisons', title: 'Word Pairs, Comparisons and Question Marks', chapter: 'Appendices A–B', pages: '195', minutes: 7,
            summary: 'Fixed pairs (not only … but also), comparing like with like, and direct vs. indirect questions.',
            practice: { skills: ['Boundaries', FSS], topics: ['question-marks'], label: 'Standard English Conventions questions' },
          },
        ],
      },
    ],
  },
  {
    slug: 'reading',
    title: 'Reading: Craft, Information & Ideas',
    short: 'Reading',
    description: 'Vocabulary in context, main ideas, purpose, inferences, evidence, graphs and paired texts, with a step-by-step method for each question type.',
    book: 'The Complete Guide to Digital SAT Reading',
    units: [
      {
        title: 'Foundations',
        lessons: [
          {
            slug: 'how-sat-reading-works', title: 'How SAT Reading Works', chapter: 'Chapter 1', pages: '15', minutes: 10,
            summary: 'What the passages look like, how wrong answers are built, and a method that works on every question.',
          },
          {
            slug: 'words-in-context', title: 'Vocabulary in Context', chapter: 'Chapter 2', pages: '29', minutes: 12,
            summary: 'Find the clue words, predict, play positive/negative, and plug it back in.',
            practice: { skills: ['Words in Context'], label: 'Words in Context questions' },
          },
          {
            slug: 'vocabulary-to-know', title: 'Second Meanings and Academic Vocabulary', chapter: 'Chapter 2 (word lists)', pages: '50', minutes: 10,
            summary: 'Common words with unusual meanings, and the academic words SAT passages lean on.',
            practice: { skills: ['Words in Context'], label: 'Words in Context questions' },
          },
          {
            slug: 'making-the-leap', title: 'Making the Leap: Pronouns and Summary Nouns', chapter: 'Chapter 3', pages: '61', minutes: 8,
            summary: 'Track what “this finding” or “the latter” refers to and you will never lose the thread.',
            practice: { skills: ['Central Ideas and Details'], topics: ['details'], label: 'detail questions that depend on tracking ideas' },
          },
        ],
      },
      {
        title: 'Big Picture and Details',
        lessons: [
          {
            slug: 'main-idea', title: 'The Big Picture: Main Ideas', chapter: 'Chapter 4', pages: '73', minutes: 12,
            summary: 'Topic + “so what?” = main point. Spot the old idea vs. new idea pattern.',
            practice: { skills: ['Central Ideas and Details'], topics: ['main-idea'], label: 'main idea questions' },
          },
          {
            slug: 'literal-comprehension', title: 'Literal Comprehension', chapter: 'Chapter 5', pages: '91', minutes: 8,
            summary: 'Same idea, different words: match the paraphrase to the exact lines.',
            practice: { skills: ['Central Ideas and Details'], topics: ['details'], label: '“according to the text” detail questions' },
          },
          {
            slug: 'function-and-purpose', title: 'Reading for Function and Purpose', chapter: 'Chapter 6', pages: '102', minutes: 13,
            summary: 'Ask why the author wrote it, not what it says.',
            practice: { skills: ['Text Structure and Purpose'], label: 'Text Structure and Purpose questions' },
          },
        ],
      },
      {
        title: 'Reasoning with Evidence',
        lessons: [
          {
            slug: 'text-completions', title: 'Text Completions (Inferences)', chapter: 'Chapter 7', pages: '121', minutes: 11,
            summary: 'One small logical step from the sentence before the blank.',
            practice: { skills: ['Inferences'], label: 'Inferences questions' },
          },
          {
            slug: 'support-and-undermine', title: 'Supporting, Undermining and Illustrating Claims', chapter: 'Chapter 8', pages: '133', minutes: 11,
            summary: 'Pin down the claim, decide what evidence would help or hurt it, then match.',
            practice: { skills: ['Command of Evidence'], topics: ['support', 'illustrate'], label: 'textual Command of Evidence questions' },
          },
          {
            slug: 'graphs-and-charts', title: 'Graphs and Charts', chapter: 'Chapter 9', pages: '145', minutes: 10,
            summary: 'Read the claim first. An answer can describe the graph correctly and still be wrong.',
            practice: { skills: ['Command of Evidence'], topics: ['quantitative'], label: 'quantitative Command of Evidence questions' },
          },
          {
            slug: 'paired-passages', title: 'Paired Passages', chapter: 'Chapter 10', pages: '159', minutes: 8,
            summary: 'Point of Text 1, point of Text 2, then the relationship.',
            practice: { skills: ['Cross-Text Connections'], label: 'Cross-Text Connections questions' },
          },
        ],
      },
    ],
  },
];

export function findCourse(slug: string) {
  return COURSES.find(c => c.slug === slug);
}

export function allLessons(course: Course) {
  return course.units.flatMap((unit, u) => unit.lessons.map(lesson => ({ ...lesson, unit: unit.title, unitIndex: u })));
}

export function findLesson(courseSlug: string, lessonSlug: string) {
  const course = findCourse(courseSlug);
  if (!course) return null;
  const list = allLessons(course);
  const i = list.findIndex(l => l.slug === lessonSlug);
  if (i < 0) return null;
  return { course, lesson: list[i], index: i, prev: list[i - 1] || null, next: list[i + 1] || null, number: i + 1 };
}

export const lessonKey = (course: string, lesson: string) => `${course}/${lesson}`;
