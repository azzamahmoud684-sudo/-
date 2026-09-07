export interface QuranReciter {
  id: string;
  name: string;
  subname: string;
  serverUrl: string;
  serverType?: 'mp3quran' | 'everyayah';
}

export const QURAN_RECITERS: QuranReciter[] = [
  {
    id: 'afs',
    name: 'مشاري بن راشد العفاسي',
    subname: 'رواية حفص عن عاصم',
    serverUrl: 'https://server8.mp3quran.net/afs',
  },
  {
    id: 'basit',
    name: 'عبد الباسط عبد الصمد',
    subname: 'المصحف المرتل',
    serverUrl: 'https://server7.mp3quran.net/basit',
  },
  {
    id: 'husr',
    name: 'محمود خليل الحصري',
    subname: 'المصحف المرتل',
    serverUrl: 'https://server13.mp3quran.net/husr',
  },
  {
    id: 'minsh',
    name: 'محمد صديق المنشاوي',
    subname: 'المصحف المرتل',
    serverUrl: 'https://server10.mp3quran.net/minsh',
  },
  {
    id: 'maher',
    name: 'ماهر المعيقلي',
    subname: 'رواية حفص عن عاصم',
    serverUrl: 'https://server12.mp3quran.net/maher',
  },
  {
    id: 's_gmd',
    name: 'سعد الغامدي',
    subname: 'رواية حفص عن عاصم',
    serverUrl: 'https://server7.mp3quran.net/s_gmd',
  },
  {
    id: 'yasser',
    name: 'ياسر الدوسري',
    subname: 'رواية حفص عن عاصم',
    serverUrl: 'https://server11.mp3quran.net/yasser',
  },
  {
    id: 'ajm',
    name: 'أحمد بن علي العجمي',
    subname: 'رواية حفص عن عاصم',
    serverUrl: 'https://server10.mp3quran.net/ajm/128',
  },
  {
    id: 'shur',
    name: 'سعود الشريم',
    subname: 'رواية حفص عن عاصم',
    serverUrl: 'https://server7.mp3quran.net/shur',
  },
];

export const DEFAULT_RECITER_ID = 'afs';

/**
 * Returns the stream URL for a given surah number and reciter ID
 */
export function getSurahAudioUrl(surahNumber: number, reciterId: string = DEFAULT_RECITER_ID): string {
  const reciter = QURAN_RECITERS.find((r) => r.id === reciterId) || QURAN_RECITERS[0];
  const paddedNum = surahNumber.toString().padStart(3, '0');
  return `${reciter.serverUrl}/${paddedNum}.mp3`;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
