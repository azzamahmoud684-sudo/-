import { SURAH_TEXTS } from '../data/quranData';

export interface LoadedSurahData {
  number: number;
  name: string;
  bismillah: boolean;
  verses: string[];
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
