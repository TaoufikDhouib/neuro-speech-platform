

export interface ExerciseTemplate {
  type: string;
  prompt: string;
  targetResponse: string;
  imagePrompt?: string;
  minAge?: number;
  maxAge?: number;
  difficulty: 1 | 2 | 3;
  domain: string;
}

export const EXERCISE_BANK: ExerciseTemplate[] = [
  // ─── PICTURE NAMING ───────────────────────────────────────────────────
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🐱",
    targetResponse: "cat",
    imagePrompt: "🐱",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🌳",
    targetResponse: "tree",
    imagePrompt: "🌳",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🚗",
    targetResponse: "car",
    imagePrompt: "🚗",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🐶",
    targetResponse: "dog",
    imagePrompt: "🐶",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🌈",
    targetResponse: "rainbow",
    imagePrompt: "🌈",
    minAge: 3, maxAge: 10,
    difficulty: 2,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🦋",
    targetResponse: "butterfly",
    imagePrompt: "🦋",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🏠",
    targetResponse: "house",
    imagePrompt: "🏠",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🍎",
    targetResponse: "apple",
    imagePrompt: "🍎",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🚂",
    targetResponse: "train",
    imagePrompt: "🚂",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🌸",
    targetResponse: "flower",
    imagePrompt: "🌸",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🦁",
    targetResponse: "lion",
    imagePrompt: "🦁",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🐘",
    targetResponse: "elephant",
    imagePrompt: "🐘",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "vocabulary",
  },
  {
    type: 'PICTURE_NAMING',
    prompt: "What is this? 🚁",
    targetResponse: "helicopter",
    imagePrompt: "🚁",
    minAge: 5, maxAge: 10,
    difficulty: 3,
    domain: "vocabulary",
  },

  // ─── WORD REPETITION ──────────────────────────────────────────────────
  {
    type: 'WORD_REPETITION',
    prompt: "Say this word: 'cat'",
    targetResponse: "cat",
    minAge: 3, maxAge: 6,
    difficulty: 1,
    domain: "articulation",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this word: 'butterfly'",
    targetResponse: "butterfly",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "articulation",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this word: 'hippopotamus'",
    targetResponse: "hippopotamus",
    minAge: 6, maxAge: 10,
    difficulty: 3,
    domain: "articulation",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this sentence: 'The big brown dog runs fast'",
    targetResponse: "The big brown dog runs fast",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "workingMemory",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this word: 'umbrella'",
    targetResponse: "umbrella",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "articulation",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this word: 'spaghetti'",
    targetResponse: "spaghetti",
    minAge: 5, maxAge: 10,
    difficulty: 3,
    domain: "articulation",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this sentence: 'She sells seashells by the seashore'",
    targetResponse: "She sells seashells by the seashore",
    minAge: 6, maxAge: 10,
    difficulty: 3,
    domain: "articulation",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this word: 'strawberry'",
    targetResponse: "strawberry",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "articulation",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this sentence: 'My little sister likes to play'",
    targetResponse: "My little sister likes to play",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "workingMemory",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this word: 'crocodile'",
    targetResponse: "crocodile",
    minAge: 5, maxAge: 10,
    difficulty: 2,
    domain: "articulation",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this sentence: 'The quick fox jumped over the lazy dog'",
    targetResponse: "The quick fox jumped over the lazy dog",
    minAge: 6, maxAge: 10,
    difficulty: 3,
    domain: "workingMemory",
  },
  {
    type: 'WORD_REPETITION',
    prompt: "Say this word: 'volcano'",
    targetResponse: "volcano",
    minAge: 5, maxAge: 10,
    difficulty: 2,
    domain: "articulation",
  },

  // ─── RHYME DETECTION ──────────────────────────────────────────────────
  {
    type: 'RHYME_DETECTION',
    prompt: "Do 'cat' and 'bat' rhyme? Say yes or no.",
    targetResponse: "yes",
    minAge: 4, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'RHYME_DETECTION',
    prompt: "Do 'dog' and 'tree' rhyme? Say yes or no.",
    targetResponse: "no",
    minAge: 4, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'RHYME_DETECTION',
    prompt: "Do 'sun' and 'fun' rhyme? Say yes or no.",
    targetResponse: "yes",
    minAge: 4, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'RHYME_DETECTION',
    prompt: "Do 'hat' and 'cup' rhyme? Say yes or no.",
    targetResponse: "no",
    minAge: 4, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'RHYME_DETECTION',
    prompt: "Do 'cake' and 'lake' rhyme? Say yes or no.",
    targetResponse: "yes",
    minAge: 4, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'RHYME_DETECTION',
    prompt: "Do 'frog' and 'log' rhyme? Say yes or no.",
    targetResponse: "yes",
    minAge: 4, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'RHYME_DETECTION',
    prompt: "Do 'ship' and 'chip' rhyme? Say yes or no.",
    targetResponse: "yes",
    minAge: 5, maxAge: 10,
    difficulty: 2,
    domain: "phonologicalAwareness",
  },
  {
    type: 'RHYME_DETECTION',
    prompt: "Do 'moon' and 'star' rhyme? Say yes or no.",
    targetResponse: "no",
    minAge: 4, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'RHYME_DETECTION',
    prompt: "Do 'night' and 'light' rhyme? Say yes or no.",
    targetResponse: "yes",
    minAge: 5, maxAge: 10,
    difficulty: 2,
    domain: "phonologicalAwareness",
  },

  // ─── PHONEME ISOLATION ────────────────────────────────────────────────
  {
    type: 'PHONEME_ISOLATION',
    prompt: "What is the first sound in 'sun'?",
    targetResponse: "s",
    minAge: 5, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'PHONEME_ISOLATION',
    prompt: "What is the last sound in 'dog'?",
    targetResponse: "g",
    minAge: 5, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'PHONEME_ISOLATION',
    prompt: "What is the first sound in 'ball'?",
    targetResponse: "b",
    minAge: 5, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'PHONEME_ISOLATION',
    prompt: "What is the last sound in 'cat'?",
    targetResponse: "t",
    minAge: 5, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'PHONEME_ISOLATION',
    prompt: "What is the first sound in 'fish'?",
    targetResponse: "f",
    minAge: 5, maxAge: 10,
    difficulty: 1,
    domain: "phonologicalAwareness",
  },
  {
    type: 'PHONEME_ISOLATION',
    prompt: "What is the middle sound in 'hat'?",
    targetResponse: "a",
    minAge: 6, maxAge: 10,
    difficulty: 2,
    domain: "phonologicalAwareness",
  },
  {
    type: 'PHONEME_ISOLATION',
    prompt: "What is the first sound in 'ship'?",
    targetResponse: "sh",
    minAge: 6, maxAge: 10,
    difficulty: 2,
    domain: "phonologicalAwareness",
  },
  {
    type: 'PHONEME_ISOLATION',
    prompt: "What is the last sound in 'brush'?",
    targetResponse: "sh",
    minAge: 6, maxAge: 10,
    difficulty: 3,
    domain: "phonologicalAwareness",
  },

  // ─── SENTENCE COMPLETION ──────────────────────────────────────────────
  {
    type: 'SENTENCE_COMPLETION',
    prompt: "The cat sat on the ___",
    targetResponse: "mat",
    minAge: 4, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'SENTENCE_COMPLETION',
    prompt: "I drink from a ___",
    targetResponse: "cup",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'SENTENCE_COMPLETION',
    prompt: "We go to sleep in a ___",
    targetResponse: "bed",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'SENTENCE_COMPLETION',
    prompt: "Birds can fly and fish can ___",
    targetResponse: "swim",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "vocabulary",
  },
  {
    type: 'SENTENCE_COMPLETION',
    prompt: "The sun shines during the ___ and the moon comes out at ___",
    targetResponse: "day night",
    minAge: 5, maxAge: 10,
    difficulty: 2,
    domain: "vocabulary",
  },
  {
    type: 'SENTENCE_COMPLETION',
    prompt: "We use an umbrella when it ___",
    targetResponse: "rains",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "vocabulary",
  },
  {
    type: 'SENTENCE_COMPLETION',
    prompt: "Ice cream is cold and fire is ___",
    targetResponse: "hot",
    minAge: 4, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },
  {
    type: 'SENTENCE_COMPLETION',
    prompt: "A baby dog is called a ___",
    targetResponse: "puppy",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "vocabulary",
  },
  {
    type: 'SENTENCE_COMPLETION',
    prompt: "We read ___ at bedtime",
    targetResponse: "books",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "vocabulary",
  },

  // ─── RAPID NAMING ─────────────────────────────────────────────────────
  {
    type: 'RAPID_NAMING',
    prompt: "Name all the animals you see: 🐶🐱🐸🦊",
    targetResponse: "dog cat frog fox",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "processingSpeed",
  },
  {
    type: 'RAPID_NAMING',
    prompt: "Name all the fruits you see: 🍎🍌🍓🍊",
    targetResponse: "apple banana strawberry orange",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "processingSpeed",
  },
  {
    type: 'RAPID_NAMING',
    prompt: "Name all the vehicles: 🚗🚂🚁✈️",
    targetResponse: "car train helicopter airplane",
    minAge: 5, maxAge: 10,
    difficulty: 2,
    domain: "processingSpeed",
  },
  {
    type: 'RAPID_NAMING',
    prompt: "Name all the colors you see: 🔴🔵🟡🟢",
    targetResponse: "red blue yellow green",
    minAge: 3, maxAge: 10,
    difficulty: 1,
    domain: "processingSpeed",
  },
  {
    type: 'RAPID_NAMING',
    prompt: "Name all the animals: 🦁🐘🦒🐧🐬",
    targetResponse: "lion elephant giraffe penguin dolphin",
    minAge: 5, maxAge: 10,
    difficulty: 3,
    domain: "processingSpeed",
  },
  {
    type: 'RAPID_NAMING',
    prompt: "Name all the foods: 🍕🍦🥕🍞",
    targetResponse: "pizza ice cream carrot bread",
    minAge: 4, maxAge: 10,
    difficulty: 2,
    domain: "processingSpeed",
  },

  // ─── STORY RETELLING ──────────────────────────────────────────────────
  {
    type: 'STORY_RETELLING',
    prompt: "I will tell you a story. A little girl named Lily found a red ball in the park. She kicked it and it rolled away. She ran after it and caught it. Now you tell me what happened.",
    targetResponse: "lily found red ball park kicked rolled ran caught",
    minAge: 5, maxAge: 10,
    difficulty: 2,
    domain: "workingMemory",
  },
  {
    type: 'STORY_RETELLING',
    prompt: "Listen carefully. Tom the dog saw a cat in a tree. He barked loudly. The cat jumped down and ran away. Tom wagged his tail. Now tell me what happened.",
    targetResponse: "tom dog cat tree barked jumped ran wagged tail",
    minAge: 5, maxAge: 10,
    difficulty: 2,
    domain: "workingMemory",
  },
  {
    type: 'STORY_RETELLING',
    prompt: "Here is a story. A boy named Sam wanted ice cream. He asked his mom. His mom said yes. They walked to the shop and got chocolate ice cream. Sam was very happy. Now tell me the story.",
    targetResponse: "sam wanted ice cream asked mom yes walked shop chocolate happy",
    minAge: 4, maxAge: 10,
    difficulty: 1,
    domain: "workingMemory",
  },
  {
    type: 'STORY_RETELLING',
    prompt: "Once there was a little turtle who wanted to climb a mountain. It was very slow but kept going every day. After many days, the turtle reached the top and saw the whole world. Tell me what happened.",
    targetResponse: "turtle climb mountain slow kept going every day reached top saw world",
    minAge: 6, maxAge: 10,
    difficulty: 3,
    domain: "workingMemory",
  },
];

/**
 * Filter exercises by child age and difficulty preferences
 */
export function getExercisesForAge(
  age: number,
  count: number = 5
): ExerciseTemplate[] {
  const ageFiltered = EXERCISE_BANK.filter((ex) => {
    const minOk = ex.minAge === undefined || age >= ex.minAge;
    const maxOk = ex.maxAge === undefined || age <= ex.maxAge;
    return minOk && maxOk;
  });

  // Determine difficulty range based on age
  let preferredDifficulties: number[];
  if (age <= 4) {
    preferredDifficulties = [1, 2];
  } else if (age <= 6) {
    preferredDifficulties = [1, 2, 3];
  } else {
    preferredDifficulties = [2, 3];
  }

  // Group by type to ensure variety
  const typeGroups: Record<string, ExerciseTemplate[]> = {};
  for (const ex of ageFiltered) {
    if (!typeGroups[ex.type]) typeGroups[ex.type] = [];
    typeGroups[ex.type].push(ex);
  }

  const allTypes = Object.keys(typeGroups);
  const selected: ExerciseTemplate[] = [];

  // Pick at least one from each major type first
  for (const type of allTypes) {
    if (selected.length >= count) break;
    const candidates = typeGroups[type].filter((e) =>
      preferredDifficulties.includes(e.difficulty)
    );
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      selected.push(pick);
    }
  }

  // Fill remaining with random age-appropriate exercises
  const remaining = ageFiltered.filter((e) => !selected.includes(e));
  shuffleArray(remaining);
  for (const ex of remaining) {
    if (selected.length >= count) break;
    selected.push(ex);
  }

  shuffleArray(selected);
  return selected.slice(0, count);
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
