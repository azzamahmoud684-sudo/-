/**
 * Quran Voice Recitation & Correction Engine (Tarteel-like)
 * 
 * Features:
 * - Real-time word-by-word Diff comparison (LCS / Dynamic Programming)
 * - Resilient phonetic normalization for Arabic Quranic text vs Speech-to-Text
 * - Multi-verse continuous recitation support without microphone interruption
 * - Prevents premature or false-positive red highlights
 */

export interface WordEvaluation {
  index: number;
  originalWord: string;      // Uthmani word with vowels/marks for display
  normalizedWord: string;    // Normalized plain text for phonetic matching
  spokenWord?: string;       // What was captured from the microphone for this word
  status: 'correct' | 'incorrect' | 'current' | 'pending';
  correction?: string;       // Expected word if incorrect
}

export interface RecitationEvaluationResult {
  words: WordEvaluation[];
  accuracyScore: number;     // 0 to 100%
  correctWordsCount: number;
  totalWordsCount: number;
  isCompleted: boolean;
  isFullyCorrect: boolean;
  rawSpokenText: string;
  matchedNextAyahStartIndex?: number; // Detected start of next verse if user overflowed into next verse
}

/**
 * Normalizes Quranic Arabic text into a resilient phonetic form matching speech recognition:
 * - Replaces dagger alif (\u0670) with standard 'ا' (except established exceptions like 'هذا', 'ذلك', 'الرحمن')
 * - Replaces Uthmani spellings like 'صلوة', 'زكوة', 'حيوة' with 'صلاة', 'زكاة', 'حياة'
 * - Strips Quranic ornaments, pause signs, end-of-ayah numbers (\u06D6 to \u06ED)
 * - Strips all Tashkeel / Harakat (fatha, damma, kasra, sukoon, shaddah, tanween)
 * - Normalizes Alef variants (إ, أ, آ, ٱ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Yaa / Alef Maksura (ى -> ي)
 * - Strips tatweel, punctuation, digits, zero-width spaces
 */
export function normalizeArabicForSpeech(text: string): string {
  if (!text) return '';

  let str = text;

  // 1. Remove Quranic stop marks, sajdah markers, and pause signs (\u06D6 to \u06ED)
  str = str.replace(/[\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u06DD\u06DE]/g, ' ');

  // 2. Remove ayah numbering brackets like ﴿١٢﴾ or (12)
  str = str.replace(/[﴿(][\u0660-\u06690-9\s]+[﴾)]/g, ' ');

  // 3. Remove zero-width characters and directional marks
  str = str.replace(/[\u200B-\u200F\uFEFF\u061C\u202A-\u202E]/g, '');

  // 4. Handle specific Quranic words where dagger alif is standardly preserved vs expanded
  str = str.replace(/صَّ?لَ?وٰ?ةَ?/g, 'صلاة');
  str = str.replace(/زَّ?كَ?وٰ?ةَ?/g, 'زكاة');
  str = str.replace(/حَ?يَ?وٰ?ةَ?/g, 'حياة');
  str = str.replace(/نَّ?جَ?وٰ?ةَ?/g, 'نجاة');
  str = str.replace(/غَ?دَ?وٰ?ةَ?/g, 'غداة');
  str = str.replace(/ٱلرِّبَوٰ?ا۟?/g, 'الربا');

  // Handle common words where dagger alif is traditionally omitted in modern writing
  str = str.replace(/هَٰذَا/g, 'هذا');
  str = str.replace(/هَٰذِهِ/g, 'هذه');
  str = str.replace(/هَٰؤُلَ/g, 'هؤل');
  str = str.replace(/ذَٰلِكَ/g, 'ذلك');
  str = str.replace(/ٱلرَّحْمَٰنِ?/g, 'الرحمن');
  str = str.replace(/إِلَٰهَ?/g, 'اله');
  str = str.replace(/ٱللَّٰهَ?/g, 'الله');
  str = str.replace(/لَٰكِن/g, 'لكن');
  str = str.replace(/يَٰٓ?أَيُّهَا/g, 'يا ايها');
  str = str.replace(/يَٰبَنِي/g, 'يا بني');

  // For any remaining dagger alifs (e.g. ٱلْعَٰلَمِينَ -> العالمين, مَٰلِكِ -> مالك, ٱلصِّرَٰطَ -> الصراط, سَمَٰوَٰت -> سماوات)
  str = str.replace(/\u0670/g, 'ا');

  // 5. Remove all Tashkeel / Harakat (fatha, damma, kasra, sukoon, shaddah, tanween)
  str = str.replace(/[\u064B-\u065F]/g, '');

  // 6. Normalize all Alef variants to standard 'ا'
  str = str.replace(/[إأآٱ]/g, 'ا');

  // 7. Normalize Taa Marbuta 'ة' -> 'ه'
  str = str.replace(/ة/g, 'ه');

  // 8. Normalize Alef Maksura 'ى' -> 'ي'
  str = str.replace(/ى/g, 'ي');

  // 9. Normalize Hamza on Waw / Yaa / isolated (ؤ, ئ)
  str = str.replace(/[ؤئ]/g, 'ء');

  // 10. Remove silent alif with zero or trailing sukoon (e.g. قالواْ -> قالوا)
  str = str.replace(/اْ/g, 'ا');

  // 11. Remove punctuation, tatweel, symbols, digits
  str = str.replace(/[ـ.,/#!$٪%^&*;:{}=\-_`~()«»""''؟?!،\\]/g, ' ');
  str = str.replace(/[\u0660-\u06690-9]/g, '');

  // 12. Normalize multiple alifs (e.g. 'اا' -> 'ا')
  str = str.replace(/ا+/g, 'ا');

  // 13. Collapse whitespace and trim
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

/**
 * Normalizes a single token for resilient comparison
 */
export function cleanSingleToken(w: string): string {
  if (!w) return '';
  return normalizeArabicForSpeech(w).trim();
}

/**
 * Levenshtein distance for fuzzy comparison
 */
export function levenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = [];
  for (let i = 0; i <= bl; i++) matrix[i] = [i];
  for (let j = 0; j <= al; j++) matrix[0][j] = j;

  for (let i = 1; i <= bl; i++) {
    for (let j = 1; j <= al; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[bl][al];
}

/**
 * Phonetic letter confusion matcher for speech engines
 * Maps commonly confused Arabic letters in Speech Recognition engines
 */
function phoneticEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  const pA = a
    .replace(/ظ/g, 'ض')
    .replace(/س/g, 'ص')
    .replace(/ز|د/g, 'ذ')
    .replace(/ت|س/g, 'ث')
    .replace(/ء/g, '');

  const pB = b
    .replace(/ظ/g, 'ض')
    .replace(/س/g, 'ص')
    .replace(/ز|د/g, 'ذ')
    .replace(/ت|س/g, 'ث')
    .replace(/ء/g, '');

  return pA === pB && pA.length > 1;
}

/**
 * Checks if a target verse word matches a spoken word accurately,
 * accounting for Arabic prefixes (و, ف, ب, ك, ل, ال), Tajweed elisions, and speech-to-text nuances.
 */
export function isWordMatch(target: string, spoken: string): boolean {
  if (!target || !spoken) return false;
  if (target === spoken) return true;

  // Direct equivalences common in Quran vs Google Speech
  if ((target === 'لله' && spoken === 'الله') || (target === 'الله' && spoken === 'لله')) return true;
  if ((target === 'بسم' && spoken === 'باسم') || (target === 'باسم' && spoken === 'بسم')) return true;
  if ((target === 'مالك' && spoken === 'ملك') || (target === 'ملك' && spoken === 'مالك')) return true;
  if ((target === 'الرحمن' && spoken === 'الرحمان') || (target === 'الرحمان' && spoken === 'الرحمن')) return true;
  if ((target === 'هذا' && spoken === 'هاذا') || (target === 'هاذا' && spoken === 'هذا')) return true;
  if ((target === 'ذلك' && spoken === 'ذالك') || (target === 'ذالك' && spoken === 'ذلك')) return true;
  if ((target === 'الصراط' && spoken === 'السراط') || (target === 'السراط' && spoken === 'الصراط')) return true;
  if ((target === 'الضالين' && spoken === 'الظالين') || (target === 'الظالين' && spoken === 'الضالين')) return true;
  if ((target === 'العظيم' && spoken === 'العضيم') || (target === 'العضيم' && spoken === 'العظيم')) return true;
  if ((target === 'كفوا' && spoken === 'كفو') || (target === 'كفو' && spoken === 'كفوا')) return true;
  if ((target === 'كفوا' && spoken === 'كفؤا') || (target === 'كفؤا' && spoken === 'كفوا')) return true;

  // Handle prefix 'و' or 'ف' attached or detached
  if (spoken.startsWith('و') && spoken.length > 2 && spoken.slice(1) === target) return true;
  if (target.startsWith('و') && target.length > 2 && target.slice(1) === spoken) return true;
  if (spoken.startsWith('ف') && spoken.length > 2 && spoken.slice(1) === target) return true;
  if (target.startsWith('ف') && target.length > 2 && target.slice(1) === spoken) return true;
  if (spoken.startsWith('ب') && spoken.length > 2 && spoken.slice(1) === target) return true;
  if (target.startsWith('ب') && target.length > 2 && target.slice(1) === spoken) return true;
  if (spoken.startsWith('ل') && spoken.length > 2 && spoken.slice(1) === target) return true;
  if (target.startsWith('ل') && target.length > 2 && target.slice(1) === spoken) return true;
  if (spoken.startsWith('ك') && spoken.length > 2 && spoken.slice(1) === target) return true;
  if (target.startsWith('ك') && target.length > 2 && target.slice(1) === spoken) return true;

  // Handle 'ال' prefix variation
  if (spoken.startsWith('ال') && spoken.length > 3 && spoken.slice(2) === target) return true;
  if (target.startsWith('ال') && target.length > 3 && target.slice(2) === spoken) return true;

  // Handle trailing tanween alif: 'ا' vs nothing (e.g. احدا vs احد, كفوا vs كفو)
  if (spoken.endsWith('ا') && spoken.length > 2 && spoken.slice(0, -1) === target) return true;
  if (target.endsWith('ا') && target.length > 2 && target.slice(0, -1) === spoken) return true;

  // Handle trailing 'وا' vs 'و' for verbs (e.g. قالوا vs قالو)
  if (spoken.endsWith('و') && target.endsWith('وا') && target.slice(0, -1) === spoken) return true;
  if (target.endsWith('و') && spoken.endsWith('وا') && spoken.slice(0, -1) === target) return true;

  // Check phonetic engine letter confusion
  if (phoneticEqual(target, spoken)) {
    return true;
  }

  // Levenshtein fuzzy match: allow 1 letter distance for words of 4+ letters
  const dist = levenshtein(target, spoken);
  if (dist === 1 && target.length >= 4 && spoken.length >= 4) {
    return true;
  }
  // Allow 2 letter distance ONLY for long words (8+ characters)
  if (dist === 2 && target.length >= 8 && spoken.length >= 8) {
    return true;
  }

  return false;
}

/**
 * Checks if two target words combined match one spoken word
 * (e.g. ["الحمد", "لله"] vs "الحمدلله" or ["و", "لا"] vs "ولا")
 */
function isCompoundMatch(targetA: string, targetB: string, spoken: string): boolean {
  if (!targetA || !targetB || !spoken) return false;
  if (spoken.length <= targetA.length || spoken.length <= targetB.length) return false;
  if (spoken.length < targetA.length + targetB.length - 2) return false;
  const combined = targetA + targetB;
  return combined === spoken || isWordMatch(combined, spoken);
}

/**
 * Checks if one target word matches two spoken words
 * (e.g. "يأيها" vs ["يا", "ايها"] or "ولا" vs ["و", "لا"])
 */
function isSplitMatch(target: string, spokenA: string, spokenB: string): boolean {
  if (!target || !spokenA || !spokenB) return false;
  if (target.length <= spokenA.length || target.length <= spokenB.length) return false;
  if (target.length < spokenA.length + spokenB.length - 2) return false;
  const combined = spokenA + spokenB;
  return combined === target || isWordMatch(target, combined);
}

/**
 * Computes word-level similarity score from 0 to 1
 */
function getWordSimilarityScore(target: string, spoken: string): number {
  if (isWordMatch(target, spoken)) return 1.0;
  const maxLen = Math.max(target.length, spoken.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshtein(target, spoken);
  const sim = 1.0 - dist / maxLen;
  return sim > 0 ? sim : 0;
}

/**
 * Evaluates recitation using a true Word-by-Word Diff algorithm (LCS / Dynamic Programming alignment).
 * 
 * Guarantees:
 * 1. Correct words turn GREEN immediately.
 * 2. Words that haven't been reached yet stay PENDING / CURRENT (GOLDEN) — NEVER prematurely marked red.
 * 3. Only words that the user genuinely skipped and recited past are marked RED (incorrect).
 * 4. Merged/split words in Arabic (e.g. الحمدلله vs الحمد لله) match seamlessly.
 * 5. Resilient against background noise, stutters, and pauses.
 */
export function compareRecitationToVerse(
  verseText: string,
  rawSpokenText: string,
  nextVerseText?: string
): RecitationEvaluationResult {
  // 1. Clean display verse text (remove end-ayah numbers like ﴿١﴾)
  const cleanedDisplayVerse = verseText
    .replace(/[﴿(][\u0660-\u06690-9\s]+[﴾)]/g, '')
    .trim();

  const originalWords = cleanedDisplayVerse.split(/\s+/).filter(Boolean);
  const normalizedTargetWords = originalWords.map((w) => cleanSingleToken(w));
  const totalWordsCount = normalizedTargetWords.length;

  // 2. Tokenize and normalize spoken words
  const normalizedSpokenWords = normalizeArabicForSpeech(rawSpokenText)
    .split(/\s+/)
    .map((w) => cleanSingleToken(w))
    .filter(Boolean);

  // If no words have been captured yet
  if (normalizedSpokenWords.length === 0) {
    return {
      words: originalWords.map((orig, i) => ({
        index: i,
        originalWord: orig,
        normalizedWord: normalizedTargetWords[i],
        status: i === 0 ? 'current' : 'pending',
      })),
      accuracyScore: 0,
      correctWordsCount: 0,
      totalWordsCount,
      isCompleted: false,
      isFullyCorrect: false,
      rawSpokenText,
    };
  }

  // 3. Dynamic Programming Diff Alignment (LCS / Sequence Matcher)
  // Find optimal mapping between targetWords[0..N-1] and spokenWords[0..M-1]
  const N = totalWordsCount;
  const M = normalizedSpokenWords.length;

  // dp[i][j] stores the best score up to target i and spoken j
  const dp: number[][] = Array.from({ length: N + 1 }, () => Array(M + 1).fill(0));
  // parent pointer for backtracking: 0 = diag (match), 1 = up (skip target), 2 = left (skip spoken)
  const parent: number[][] = Array.from({ length: N + 1 }, () => Array(M + 1).fill(0));

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      const t = normalizedTargetWords[i - 1];
      const s = normalizedSpokenWords[j - 1];

      let matchScore = 0;
      if (isWordMatch(t, s)) {
        matchScore = 2.0;
      } else {
        const sim = getWordSimilarityScore(t, s);
        if (sim >= 0.72) {
          matchScore = 1.5;
        }
      }

      // Check compound match: 2 target words vs 1 spoken word
      let compoundScore = 0;
      if (i >= 2 && isCompoundMatch(normalizedTargetWords[i - 2], t, s)) {
        compoundScore = 3.5;
      }

      // Check split match: 1 target word vs 2 spoken words
      let splitScore = 0;
      if (j >= 2 && isSplitMatch(t, normalizedSpokenWords[j - 2], s)) {
        splitScore = 3.5;
      }

      let best = -1;
      let p = 1;

      // Option 1: Match diag (only if there is a match)
      if (matchScore > 0) {
        best = dp[i - 1][j - 1] + matchScore;
        p = 0;
      }

      // Option 2: Compound match
      if (compoundScore > 0 && i >= 2) {
        const cVal = dp[i - 2][j - 1] + compoundScore;
        if (cVal > best) {
          best = cVal;
          p = 3; // compound
        }
      }

      // Option 3: Split match
      if (splitScore > 0 && j >= 2) {
        const sVal = dp[i - 1][j - 2] + splitScore;
        if (sVal > best) {
          best = sVal;
          p = 4; // split
        }
      }

      // Option 4: Skip target (cost 0)
      if (dp[i - 1][j] >= best) {
        best = dp[i - 1][j];
        p = 1;
      }

      // Option 5: Skip spoken word (filler / noise / repeated word)
      if (dp[i][j - 1] > best) {
        best = dp[i][j - 1];
        p = 2;
      }

      dp[i][j] = best;
      parent[i][j] = p;
    }
  }

  // 4. Backtrack to find aligned pairs
  const targetMatches = new Map<number, string>(); // targetIndex -> spokenWord
  let currI = N;
  let currJ = M;

  while (currI > 0 && currJ > 0) {
    const p = parent[currI][currJ];
    if (p === 0) {
      // Direct / fuzzy match
      const t = normalizedTargetWords[currI - 1];
      const s = normalizedSpokenWords[currJ - 1];
      if (isWordMatch(t, s) || getWordSimilarityScore(t, s) >= 0.72) {
        targetMatches.set(currI - 1, s);
      }
      currI--;
      currJ--;
    } else if (p === 3) {
      // Compound match: target[currI - 2] and target[currI - 1] matched spoken[currJ - 1]
      const s = normalizedSpokenWords[currJ - 1];
      targetMatches.set(currI - 1, s);
      targetMatches.set(currI - 2, s);
      currI -= 2;
      currJ--;
    } else if (p === 4) {
      // Split match: target[currI - 1] matched spoken[currJ - 2] + spoken[currJ - 1]
      const sCombined = normalizedSpokenWords[currJ - 2] + ' ' + normalizedSpokenWords[currJ - 1];
      targetMatches.set(currI - 1, sCombined);
      currI--;
      currJ -= 2;
    } else if (p === 1) {
      // Skip target
      currI--;
    } else {
      // Skip spoken
      currJ--;
    }
  }

  // 5. Build WordEvaluation list with forgiving status determination
  // Find highest matched target index
  let maxMatchedTargetIdx = -1;
  for (let i = 0; i < N; i++) {
    if (targetMatches.has(i)) {
      maxMatchedTargetIdx = i;
    }
  }

  let correctCount = 0;
  const wordEvaluations: WordEvaluation[] = originalWords.map((orig, i) => {
    const norm = normalizedTargetWords[i];
    const matchedSpoken = targetMatches.get(i);

    if (matchedSpoken) {
      correctCount++;
      return {
        index: i,
        originalWord: orig,
        normalizedWord: norm,
        spokenWord: matchedSpoken,
        status: 'correct',
      };
    }

    // Word not matched:
    if (i > maxMatchedTargetIdx) {
      // User hasn't reached this word yet!
      // NEVER mark red! Mark current if immediate next, or pending.
      return {
        index: i,
        originalWord: orig,
        normalizedWord: norm,
        status: i === maxMatchedTargetIdx + 1 ? 'current' : 'pending',
      };
    } else {
      // User recited past this word and matched later words, so this word was skipped!
      return {
        index: i,
        originalWord: orig,
        normalizedWord: norm,
        status: 'incorrect',
        correction: orig,
      };
    }
  });

  // Calculate accuracy score
  const accuracyScore = N > 0 ? Math.round((correctCount / N) * 100) : 0;
  const isCompleted = maxMatchedTargetIdx === N - 1 || correctCount === N;
  const isFullyCorrect = isCompleted && wordEvaluations.every((w) => w.status === 'correct');

  // 6. Check if user continued into next verse (Continuous Recitation detection)
  let matchedNextAyahStartIndex: number | undefined;
  if (nextVerseText && isCompleted) {
    const nextNormTokens = normalizeArabicForSpeech(nextVerseText)
      .split(/\s+/)
      .map((w) => cleanSingleToken(w))
      .filter(Boolean);

    // Look at remaining spoken words after the last matched target word
    if (nextNormTokens.length > 0 && M > 0) {
      // If any of the last spoken words match the beginning of the next verse
      const lastSpoken = normalizedSpokenWords[M - 1];
      if (isWordMatch(nextNormTokens[0], lastSpoken)) {
        matchedNextAyahStartIndex = 0;
      }
    }
  }

  return {
    words: wordEvaluations,
    accuracyScore,
    correctWordsCount: correctCount,
    totalWordsCount: N,
    isCompleted,
    isFullyCorrect,
    rawSpokenText,
    matchedNextAyahStartIndex,
  };
}

/**
 * Checks if the browser supports the Web Speech API (SpeechRecognition)
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

/**
 * Creates a configured Arabic SpeechRecognition instance
 */
export function createSpeechRecognitionInstance(): any {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return null;
  }

  const recognition = new SpeechRecognitionClass();
  recognition.lang = 'ar-SA'; // Standard Arabic
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  return recognition;
}
