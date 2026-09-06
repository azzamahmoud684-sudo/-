import { SURAH_TEXTS, ALL_SURAHS, SurahMeta } from '../data/quranData';

export interface LoadedSurahData {
  number: number;
  name: string;
  bismillah: boolean;
  verses: string[];
}

export interface QuranAyah {
  number: number;               // global ayah number (1 to 6236)
  text: string;                 // raw text
  cleanText: string;            // text without leading bismillah when applicable
  numberInSurah: number;        // 1, 2, 3...
  juz: number;                  // 1 to 30
  hizbQuarter: number;          // 1 to 240
  surahNumber: number;          // 1 to 114
  surahName: string;            // e.g. سورة الفاتحة
  surahEnglishName: string;     // e.g. Al-Fatiha
  revelationType: string;       // مكية أو مدنية
  totalAyahsInSurah: number;    // e.g. 7
  isFirstInSurah: boolean;      // true if numberInSurah === 1
  pageNumber: number;           // 1 to 604
}

export interface QuranPageData {
  pageNumber: number;           // 1 to 604
  juz: number;
  hizbQuarter: number;
  surahsOnPage: {
    number: number;
    name: string;
    englishName: string;
    revelationType: string;
    numberOfAyahs: number;
  }[];
  ayahs: QuranAyah[];
}

/**
 * Converts English digits to Arabic-Indic numerals: 1 -> ١, 2 -> ٢, etc.
 */
export function toArabicNumeral(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((d) => arabicDigits[parseInt(d, 10)] ?? d)
    .join('');
}

/**
 * Helper to get surah info from ALL_SURAHS
 */
export function getSurahByNumber(num: number): SurahMeta | undefined {
  return ALL_SURAHS.find((s) => s.number === num);
}

/**
 * Strips Bismillah from the beginning of ayah text if it is present
 */
export function stripLeadingBismillah(text: string): string {
  let cleaned = text.trim();
  const prefixes = [
    '﻿بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ',
  ];

  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }
  return cleaned;
}

/**
 * Fetches an exact physical Madani Quran page (1 to 604)
 * Uses in-memory and localStorage cache for instant page flips.
 */
const inMemoryPageCache = new Map<number, QuranPageData>();

export async function getQuranPage(pageNumber: number): Promise<QuranPageData> {
  const safePage = Math.min(604, Math.max(1, pageNumber));

  // 1. Check in-memory cache
  if (inMemoryPageCache.has(safePage)) {
    return inMemoryPageCache.get(safePage)!;
  }

  // 2. Check localStorage cache
  const cacheKey = `ouns_quran_page_v2_${safePage}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: QuranPageData = JSON.parse(cached);
      if (parsed.ayahs && parsed.ayahs.length > 0) {
        inMemoryPageCache.set(safePage, parsed);
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // 3. Fetch from verified Quran API
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/page/${safePage}/quran-uthmani`);
    if (!res.ok) {
      throw new Error(`Failed to fetch Quran page ${safePage}: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.code === 200 && json.data && Array.isArray(json.data.ayahs)) {
      const rawAyahs = json.data.ayahs;
      const surahsMap = new Map<number, any>();

      const ayahs: QuranAyah[] = rawAyahs.map((raw: any) => {
        const surahNumber = raw.surah.number;
        const numberInSurah = raw.numberInSurah;
        const isFirstInSurah = numberInSurah === 1;

        if (!surahsMap.has(surahNumber)) {
          surahsMap.set(surahNumber, {
            number: surahNumber,
            name: raw.surah.name || '',
            englishName: raw.surah.englishName || '',
            revelationType: raw.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
            numberOfAyahs: raw.surah.numberOfAyahs,
          });
        }

        let cleanText = raw.text.trim();
        // Remove zero-width bom or spaces
        cleanText = cleanText.replace(/^\uFEFF/, '').trim();

        // If ayah 1 of any surah other than Al-Fatihah (#1) and At-Tawbah (#9), strip leading Bismillah so header displays it
        if (isFirstInSurah && surahNumber !== 1 && surahNumber !== 9) {
          cleanText = stripLeadingBismillah(cleanText);
        }

        return {
          number: raw.number,
          text: raw.text,
          cleanText,
          numberInSurah,
          juz: raw.juz,
          hizbQuarter: raw.hizbQuarter,
          surahNumber,
          surahName: raw.surah.name,
          surahEnglishName: raw.surah.englishName,
          revelationType: raw.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
          totalAyahsInSurah: raw.surah.numberOfAyahs,
          isFirstInSurah,
          pageNumber: safePage,
        };
      });

      const firstAyah = ayahs[0];
      const pageData: QuranPageData = {
        pageNumber: safePage,
        juz: firstAyah ? firstAyah.juz : Math.min(30, Math.ceil(safePage / 20)),
        hizbQuarter: firstAyah ? firstAyah.hizbQuarter : 1,
        surahsOnPage: Array.from(surahsMap.values()),
        ayahs,
      };

      inMemoryPageCache.set(safePage, pageData);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(pageData));
      } catch {
        // quota ignore
      }

      return pageData;
    }
  } catch (error) {
    console.error(`Error loading page ${safePage}:`, error);
  }

  // Fallback if network offline
  const fallbackSurah = ALL_SURAHS.find((s) => s.startPage === safePage) || ALL_SURAHS[0];
  return {
    pageNumber: safePage,
    juz: fallbackSurah.juz,
    hizbQuarter: 1,
    surahsOnPage: [
      {
        number: fallbackSurah.number,
        name: fallbackSurah.name,
        englishName: fallbackSurah.englishName,
        revelationType: fallbackSurah.revelationType,
        numberOfAyahs: fallbackSurah.numberOfAyahs,
      },
    ],
    ayahs: [
      {
        number: 1,
        text: 'تعذّر تحميل صفحة القرآن الكريم حالياً. يُرجى التحقق من اتصالك بالإنترنت والضغط على إعادة المحاولة.',
        cleanText: 'تعذّر تحميل صفحة القرآن الكريم حالياً. يُرجى التحقق من اتصالك بالإنترنت والضغط على إعادة المحاولة.',
        numberInSurah: 1,
        juz: fallbackSurah.juz,
        hizbQuarter: 1,
        surahNumber: fallbackSurah.number,
        surahName: fallbackSurah.name,
        surahEnglishName: fallbackSurah.englishName,
        revelationType: fallbackSurah.revelationType,
        totalAyahsInSurah: fallbackSurah.numberOfAyahs,
        isFirstInSurah: true,
        pageNumber: safePage,
      },
    ],
  };
}

/**
 * Preload adjacent pages into cache in background for instantaneous page flips
 */
export function preloadAdjacentPages(currentPage: number): void {
  const next = currentPage + 1;
  const prev = currentPage - 1;

  if (next <= 604 && !inMemoryPageCache.has(next)) {
    getQuranPage(next).catch(() => {});
  }
  if (prev >= 1 && !inMemoryPageCache.has(prev)) {
    getQuranPage(prev).catch(() => {});
  }
}

/**
 * Fetches the full text of any Surah (1 to 114):
 * 1. Checks hardcoded SURAH_TEXTS first
 * 2. Checks localStorage cache next
 * 3. Fetches from the verified public Quran API (api.alquran.cloud)
 */
export async function getSurahVerses(surahNumber: number): Promise<LoadedSurahData> {
  // 1. Check bundled texts
  if (SURAH_TEXTS[surahNumber]) {
    const bundled = SURAH_TEXTS[surahNumber];
    return {
      number: surahNumber,
      name: '',
      bismillah: bundled.bismillah,
      verses: bundled.verses,
    };
  }

  // 2. Check localStorage cache
  const cacheKey = `ouns_surah_cache_v2_${surahNumber}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: LoadedSurahData = JSON.parse(cached);
      if (parsed.verses && parsed.verses.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore cache errors
  }

  // 3. Fetch from API
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
    if (!res.ok) {
      throw new Error(`Failed to fetch surah: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.code === 200 && data.data && data.data.ayahs) {
      const isAtTawbah = surahNumber === 9;
      const isAlFatihah = surahNumber === 1;

      const rawAyahs: { text: string; numberInSurah: number }[] = data.data.ayahs;

      const verses = rawAyahs.map((ayah, index) => {
        let text = ayah.text.trim();

        // In Uthmani text API, non-Fatiha surahs have Bismillah prefixed in ayah 1
        if (!isAtTawbah && !isAlFatihah && index === 0) {
          const bismillahPrefix = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
          const simpleBismillah = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
          if (text.startsWith(bismillahPrefix)) {
            text = text.slice(bismillahPrefix.length).trim();
          } else if (text.startsWith(simpleBismillah)) {
            text = text.slice(simpleBismillah.length).trim();
          }
        }

        const arabicNumber = toArabicNumeral(ayah.numberInSurah);
        return `${text} ﴿${arabicNumber}﴾`;
      });

      const result: LoadedSurahData = {
        number: surahNumber,
        name: data.data.name || '',
        bismillah: !isAtTawbah,
        verses,
      };

      // Save into cache for instant subsequent reads
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {
        // quota exceeded or private mode, ignore
      }

      return result;
    }
  } catch (error) {
    console.error(`Error loading verses for surah ${surahNumber}:`, error);
  }

  // Fallback if network fails
  return {
    number: surahNumber,
    name: '',
    bismillah: surahNumber !== 9,
    verses: [
      'تعذّر تحميل نص السورة حالياً. يُرجى التأكد من اتصالك بالإنترنت، أو الاستماع إلى التلاوة الصوتية المباركة عبر زر الاستماع.',
    ],
  };
}
