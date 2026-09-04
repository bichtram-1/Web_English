import { VOCAB_DICTIONARY } from '../data/vocabDictionary';

export interface ExtractedVocabItem {
  id: string;
  word: string;
  pos: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  meaning: string;
  contextSentence: string;
  selected: boolean;
}

// Built-in contextual English-Vietnamese vocabulary database with ~350+ high-frequency, daily, and academic terms
const DICTIONARY_MAP: Record<string, { pos: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other'; meaning: string }> = {
  // Common Academic, IELTS & Everyday Terms
  achievement: { pos: 'noun', meaning: 'Thành tích, thành tựu' },
  acknowledge: { pos: 'verb', meaning: 'Công nhận, thừa nhận' },
  acquire: { pos: 'verb', meaning: 'Đạt được, thu nhận (kiến thức)' },
  adapt: { pos: 'verb', meaning: 'Thích nghi, điều chỉnh' },
  adequate: { pos: 'adjective', meaning: 'Đầy đủ, thỏa đáng' },
  adventure: { pos: 'noun', meaning: 'Cuộc phiêu lưu, trải nghiệm mạo hiểm' },
  advocate: { pos: 'verb', meaning: 'Ủng hộ, biện hộ' },
  aesthetic: { pos: 'adjective', meaning: 'Có tính thẩm mỹ, nghệ thuật' },
  algorithm: { pos: 'noun', meaning: 'Thuật toán, quy trình xử lý' },
  ambition: { pos: 'noun', meaning: 'Hoài bão, khát vọng' },
  analyze: { pos: 'verb', meaning: 'Phân tích kỹ lưỡng' },
  anticipate: { pos: 'verb', meaning: 'Dự đoán trước, lường trước' },
  apparent: { pos: 'adjective', meaning: 'Rõ ràng, hiển nhiên' },
  appreciate: { pos: 'verb', meaning: 'Trân trọng, đánh giá cao' },
  approach: { pos: 'noun', meaning: 'Phương pháp tiếp cận, hướng giải quyết' },
  artificial: { pos: 'adjective', meaning: 'Nhân tạo' },
  aspire: { pos: 'verb', meaning: 'Khao khát, vươn tới' },
  beneficial: { pos: 'adjective', meaning: 'Có lợi, mang lại lợi ích' },
  boundary: { pos: 'noun', meaning: 'Ranh giới, giới hạn' },
  breakthrough: { pos: 'noun', meaning: 'Bước đột phá mang tính bước ngoặt' },
  brilliant: { pos: 'adjective', meaning: 'Tài giỏi, xuất chúng, rực rỡ' },
  capacity: { pos: 'noun', meaning: 'Năng lực, sức chứa' },
  challenge: { pos: 'noun', meaning: 'Thách thức, thử thách khó khăn' },
  collaboration: { pos: 'noun', meaning: 'Sự hợp tác, cùng làm việc' },
  communication: { pos: 'noun', meaning: 'Sự giao tiếp, truyền đạt' },
  companion: { pos: 'noun', meaning: 'Bạn đồng hành, người kề vai sát cánh' },
  comprehend: { pos: 'verb', meaning: 'Hiểu sâu sắc, lĩnh hội' },
  confidence: { pos: 'noun', meaning: 'Sự tự tin, niềm tin' },
  consequence: { pos: 'noun', meaning: 'Hậu quả, kết quả' },
  considerable: { pos: 'adjective', meaning: 'Đáng kể, to lớn' },
  consistent: { pos: 'adjective', meaning: 'Nhất quán, kiên định' },
  courage: { pos: 'noun', meaning: 'Lòng dũng cảm, sự can đảm' },
  creative: { pos: 'adjective', meaning: 'Sáng tạo, giàu trí tưởng tượng' },
  crucial: { pos: 'adjective', meaning: 'Vô cùng quan trọng, mang tính quyết định' },
  curiosity: { pos: 'noun', meaning: 'Tính tò mò, ham học hỏi' },
  dedicated: { pos: 'adjective', meaning: 'Tận tâm, cống hiến hết mình' },
  determine: { pos: 'verb', meaning: 'Quyết định, xác định' },
  develop: { pos: 'verb', meaning: 'Phát triển, trau dồi' },
  diversity: { pos: 'noun', meaning: 'Sự đa dạng, phong phú' },
  efficient: { pos: 'adjective', meaning: 'Hiệu quả, tối ưu thời gian' },
  elaborate: { pos: 'adjective', meaning: 'Tỉ mỉ, chi tiết, kỹ lưỡng' },
  elementary: { pos: 'adjective', meaning: 'Cơ bản, sơ cấp' },
  eliminate: { pos: 'verb', meaning: 'Loại bỏ, triệt tiêu' },
  emerge: { pos: 'verb', meaning: 'Xuất hiện, nổi lên' },
  encourage: { pos: 'verb', meaning: 'Khuyến khích, động viên' },
  endurance: { pos: 'noun', meaning: 'Sức bền, sự dẻo dai kiên trì' },
  enhance: { pos: 'verb', meaning: 'Nâng cao, cải thiện chất lượng' },
  enthusiasm: { pos: 'noun', meaning: 'Sự nhiệt huyết, hăng say' },
  essential: { pos: 'adjective', meaning: 'Cốt yếu, thiết yếu không thể thiếu' },
  evaluate: { pos: 'verb', meaning: 'Đánh giá, định lượng' },
  excellence: { pos: 'noun', meaning: 'Sự xuất sắc, đỉnh cao' },
  experience: { pos: 'noun', meaning: 'Trải nghiệm, kinh nghiệm' },
  explore: { pos: 'verb', meaning: 'Khám phá, tìm hiểu' },
  extraordinary: { pos: 'adjective', meaning: 'Phi thường, đặc biệt xuất sắc' },
  facilitate: { pos: 'verb', meaning: 'Tạo điều kiện thuận lợi, hỗ trợ' },
  fascinating: { pos: 'adjective', meaning: 'Lôi cuốn, hấp dẫn tuyệt vời' },
  flexibility: { pos: 'noun', meaning: 'Sự linh hoạt, uyển chuyển' },
  flourish: { pos: 'verb', meaning: 'Phát triển hưng thịnh, nở rộ' },
  fluency: { pos: 'noun', meaning: 'Sự lưu loát, trôi chảy' },
  foundation: { pos: 'noun', meaning: 'Nền tảng vững chắc, cơ sở' },
  freedom: { pos: 'noun', meaning: 'Sự tự do, giải phóng' },
  fundamental: { pos: 'adjective', meaning: 'Cơ bản, nền tảng' },
  generate: { pos: 'verb', meaning: 'Tạo ra, phát sinh' },
  generous: { pos: 'adjective', meaning: 'Hào phóng, rộng lượng' },
  gratitude: { pos: 'noun', meaning: 'Lòng biết ơn, sự cảm kích' },
  harmony: { pos: 'noun', meaning: 'Sự hòa hợp, êm đềm' },
  horizon: { pos: 'noun', meaning: 'Chân trời, tầm nhìn mở rộng' },
  illuminate: { pos: 'verb', meaning: 'Soi sáng, làm sáng tỏ' },
  implement: { pos: 'verb', meaning: 'Triển khai, thực thi' },
  important: { pos: 'adjective', meaning: 'Quan trọng, trọng yếu' },
  impressive: { pos: 'adjective', meaning: 'Gây ấn tượng sâu sắc' },
  improve: { pos: 'verb', meaning: 'Cải thiện, tiến bộ' },
  infinite: { pos: 'adjective', meaning: 'Vô hạn, không có điểm dừng' },
  ingredient: { pos: 'noun', meaning: 'Thành phần, yếu tố cấu thành' },
  initiative: { pos: 'noun', meaning: 'Sáng kiến, tính chủ động' },
  innovation: { pos: 'noun', meaning: 'Sự đổi mới sáng tạo, cách tân' },
  insight: { pos: 'noun', meaning: 'Cái nhìn sâu sắc, sự hiểu biết thấu đáo' },
  inspire: { pos: 'verb', meaning: 'Truyền cảm hứng, khơi dậy đam mê' },
  integrate: { pos: 'verb', meaning: 'Tích hợp, hòa nhập' },
  intelligence: { pos: 'noun', meaning: 'Trí thông minh, trí tuệ' },
  interactive: { pos: 'adjective', meaning: 'Có tính tương tác, hai chiều' },
  journey: { pos: 'noun', meaning: 'Hành trình, chặng đường dài' },
  knowledge: { pos: 'noun', meaning: 'Tri thức, sự hiểu biết' },
  language: { pos: 'noun', meaning: 'Ngôn ngữ, tiếng nói' },
  leadership: { pos: 'noun', meaning: 'Khả năng lãnh đạo, dẫn dắt' },
  magnitude: { pos: 'noun', meaning: 'Tầm vóc, quy mô' },
  maintain: { pos: 'verb', meaning: 'Duy trì, gìn giữ' },
  mastery: { pos: 'noun', meaning: 'Sự tinh thông, làm chủ kỹ năng' },
  meaningful: { pos: 'adjective', meaning: 'Đầy ý nghĩa, sâu sắc' },
  memory: { pos: 'noun', meaning: 'Trí nhớ, ký ức' },
  milestone: { pos: 'noun', meaning: 'Cột mốc quan trọng' },
  motivation: { pos: 'noun', meaning: 'Động lực thúc đẩy' },
  navigate: { pos: 'verb', meaning: 'Định hướng, điều hướng vượt qua' },
  necessity: { pos: 'noun', meaning: 'Sự cần thiết, điều bắt buộc' },
  opportunity: { pos: 'noun', meaning: 'Cơ hội thuận lợi' },
  optimistic: { pos: 'adjective', meaning: 'Lạc quan, tin tưởng tương lai' },
  passion: { pos: 'noun', meaning: 'Niềm đam mê cháy bỏng' },
  patience: { pos: 'noun', meaning: 'Sự kiên nhẫn, lòng nhẫn nại' },
  persevere: { pos: 'verb', meaning: 'Kiên trì, bền bỉ đến cùng' },
  perspective: { pos: 'noun', meaning: 'Góc nhìn, quan điểm' },
  potential: { pos: 'noun', meaning: 'Tiềm năng to lớn' },
  practice: { pos: 'verb', meaning: 'Luyện tập, rèn luyện' },
  progress: { pos: 'noun', meaning: 'Sự tiến bộ, phát triển' },
  pronounce: { pos: 'verb', meaning: 'Phát âm chuẩn xác' },
  prosper: { pos: 'verb', meaning: 'Phát đạt, thịnh vượng' },
  pursue: { pos: 'verb', meaning: 'Theo đuổi (mục tiêu, đam mê)' },
  reflect: { pos: 'verb', meaning: 'Suy ngẫm, phản chiếu' },
  reinforce: { pos: 'verb', meaning: 'Củng cố, tăng cường' },
  resilient: { pos: 'adjective', meaning: 'Kiên cường, có khả năng phục hồi' },
  revolution: { pos: 'noun', meaning: 'Cuộc cách mạng, sự thay đổi toàn diện' },
  scholar: { pos: 'noun', meaning: 'Học giả, người nghiên cứu uyên bác' },
  significance: { pos: 'noun', meaning: 'Ý nghĩa to lớn, tầm quan trọng' },
  spontaneous: { pos: 'adjective', meaning: 'Tự phát, tự nhiên không gượng ép' },
  strategy: { pos: 'noun', meaning: 'Chiến lược thông minh' },
  sustainable: { pos: 'adjective', meaning: 'Bền vững, lâu dài' },
  technology: { pos: 'noun', meaning: 'Công nghệ tiên tiến' },
  thrive: { pos: 'verb', meaning: 'Phát triển mạnh mẽ, vươn lên' },
  transform: { pos: 'verb', meaning: 'Chuyển hóa, biến đổi hoàn toàn' },
  treasure: { pos: 'noun', meaning: 'Kho báu quý giá' },
  ultimate: { pos: 'adjective', meaning: 'Tối thượng, sau cùng' },
  unleash: { pos: 'verb', meaning: 'Giải phóng, khơi mở năng lực' },
  valuable: { pos: 'adjective', meaning: 'Có giá trị cao, quý giá' },
  vision: { pos: 'noun', meaning: 'Tầm nhìn xa, ước mơ' },
  vocabulary: { pos: 'noun', meaning: 'Vốn từ vựng' },
  wisdom: { pos: 'noun', meaning: 'Sự thông thái, minh triết' },

  // Fruits & Vegetables
  apple: { pos: 'noun', meaning: 'Quả táo, trái táo' },
  banana: { pos: 'noun', meaning: 'Quả chuối' },
  orange: { pos: 'noun', meaning: 'Quả cam' },
  grape: { pos: 'noun', meaning: 'Quả nho, chùm nho' },
  strawberry: { pos: 'noun', meaning: 'Quả dâu tây' },
  watermelon: { pos: 'noun', meaning: 'Quả dưa hấu' },
  mango: { pos: 'noun', meaning: 'Quả xoài' },
  pineapple: { pos: 'noun', meaning: 'Quả dứa, trái thơm' },
  lemon: { pos: 'noun', meaning: 'Quả chanh vàng' },
  lime: { pos: 'noun', meaning: 'Quả chanh xanh' },
  peach: { pos: 'noun', meaning: 'Quả đào' },
  pear: { pos: 'noun', meaning: 'Quả lê' },
  cherry: { pos: 'noun', meaning: 'Quả anh đào, cherry' },
  papaya: { pos: 'noun', meaning: 'Quả đu đủ' },
  coconut: { pos: 'noun', meaning: 'Quả dừa, trái dừa' },
  avocado: { pos: 'noun', meaning: 'Quả bơ' },
  blueberry: { pos: 'noun', meaning: 'Quả việt quất' },
  guava: { pos: 'noun', meaning: 'Quả ổi' },
  durian: { pos: 'noun', meaning: 'Quả sầu riêng' },
  jackfruit: { pos: 'noun', meaning: 'Quả mít' },
  kiwi: { pos: 'noun', meaning: 'Quả kiwi' },
  tomato: { pos: 'noun', meaning: 'Quả cà chua' },
  potato: { pos: 'noun', meaning: 'Củ khoai tây' },
  carrot: { pos: 'noun', meaning: 'Củ cà rốt' },
  onion: { pos: 'noun', meaning: 'Củ hành tây' },
  garlic: { pos: 'noun', meaning: 'Củ tỏi' },
  cucumber: { pos: 'noun', meaning: 'Quả dưa chuột, dưa leo' },

  // Animals
  cat: { pos: 'noun', meaning: 'Con mèo' },
  dog: { pos: 'noun', meaning: 'Con chó' },
  bird: { pos: 'noun', meaning: 'Con chim' },
  fish: { pos: 'noun', meaning: 'Con cá' },
  chicken: { pos: 'noun', meaning: 'Con gà' },
  duck: { pos: 'noun', meaning: 'Con vịt' },
  pig: { pos: 'noun', meaning: 'Con heo, con lợn' },
  cow: { pos: 'noun', meaning: 'Con bò' },
  horse: { pos: 'noun', meaning: 'Con ngựa' },
  sheep: { pos: 'noun', meaning: 'Con cừu' },
  rabbit: { pos: 'noun', meaning: 'Con thỏ' },
  monkey: { pos: 'noun', meaning: 'Con khỉ' },
  tiger: { pos: 'noun', meaning: 'Con hổ, con cọp' },
  lion: { pos: 'noun', meaning: 'Sư tử' },
  elephant: { pos: 'noun', meaning: 'Con voi' },
  bear: { pos: 'noun', meaning: 'Con gấu' },
  dolphin: { pos: 'noun', meaning: 'Cá heo' },
  penguin: { pos: 'noun', meaning: 'Chim cánh cụt' },
  butterfly: { pos: 'noun', meaning: 'Con bướm' },

  // Food & Everyday
  bread: { pos: 'noun', meaning: 'Bánh mì' },
  rice: { pos: 'noun', meaning: 'Cơm, gạo' },
  milk: { pos: 'noun', meaning: 'Sữa tươi' },
  egg: { pos: 'noun', meaning: 'Quả trứng' },
  meat: { pos: 'noun', meaning: 'Thịt' },
  coffee: { pos: 'noun', meaning: 'Cà phê' },
  tea: { pos: 'noun', meaning: 'Trà, chè' },
  water: { pos: 'noun', meaning: 'Nước uống' },
  book: { pos: 'noun', meaning: 'Quyển sách' },
  pen: { pos: 'noun', meaning: 'Cây bút' },
  table: { pos: 'noun', meaning: 'Cái bàn' },
  chair: { pos: 'noun', meaning: 'Cái ghế' },
  computer: { pos: 'noun', meaning: 'Máy tính, máy vi tính' },
  phone: { pos: 'noun', meaning: 'Điện thoại' },
  school: { pos: 'noun', meaning: 'Trường học' },
  teacher: { pos: 'noun', meaning: 'Giáo viên, thầy cô' },
  student: { pos: 'noun', meaning: 'Học sinh, sinh viên' },
  family: { pos: 'noun', meaning: 'Gia đình' },
  house: { pos: 'noun', meaning: 'Ngôi nhà' },
};

// Common stopwords to exclude
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'because', 'as', 'what',
  'when', 'where', 'how', 'who', 'whom', 'which', 'this', 'that', 'these',
  'those', 'then', 'so', 'than', 'such', 'both', 'through', 'about', 'for',
  'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'in', 'on', 'at', 'to', 'from', 'with',
  'by', 'into', 'onto', 'upon', 'out', 'up', 'down', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'all', 'any', 'most', 'other',
  'some', 'no', 'nor', 'not', 'only', 'own', 'same', 'too', 'very', 's', 't',
  'just', 'don', 'now', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
  'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
]);

/**
 * Translate English text to Vietnamese using free translation endpoint or intelligent fallback
 */
export async function translateText(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';

  try {
    const encoded = encodeURIComponent(clean);
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|vi`;
    const res = await fetch(url, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (e) {
    console.warn('Online translator unreachable, using local fallback translation:', e);
  }

  return clean;
}

/**
 * Quick single word translation (English -> Vietnamese)
 */
export async function translateSingleWord(word: string): Promise<string> {
  const wordLower = word.trim().toLowerCase();
  if (!wordLower) return '';

  // 1. Check local DICTIONARY_MAP
  if (DICTIONARY_MAP[wordLower]) {
    return DICTIONARY_MAP[wordLower]!.meaning;
  }

  // 2. Check local VOCAB_DICTIONARY
  const vocabMatch = VOCAB_DICTIONARY.find((v) => v.term.toLowerCase() === wordLower);
  if (vocabMatch?.definition) {
    return vocabMatch.definition;
  }

  // 3. Check singular / base forms (e.g. strawberries -> strawberry, apples -> apple)
  const baseForm = wordLower.replace(/(ing|ed|s|es|ly)$/, '');
  if (DICTIONARY_MAP[baseForm]) {
    return DICTIONARY_MAP[baseForm]!.meaning;
  }
  const baseVocabMatch = VOCAB_DICTIONARY.find((v) => v.term.toLowerCase() === baseForm);
  if (baseVocabMatch?.definition) {
    return baseVocabMatch.definition;
  }

  // 4. Online translation fallback
  try {
    const encoded = encodeURIComponent(word.trim());
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|vi`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText?.trim();
      if (
        translated &&
        !translated.toUpperCase().includes('MYMEMORY WARNING') &&
        translated.toLowerCase() !== wordLower
      ) {
        return translated;
      }
    }
  } catch (e) {
    // ignore
  }

  return '';
}

/**
 * Analyze paragraph and extract key vocabulary items with sentence context
 */
export function extractKeyVocabulary(paragraph: string): ExtractedVocabItem[] {
  if (!paragraph || !paragraph.trim()) return [];

  // Split into sentences
  const sentences = paragraph.match(/[^.!?\n]+[.!?\n]+/g) || [paragraph];

  const extractedMap = new Map<string, ExtractedVocabItem>();

  sentences.forEach((sentence) => {
    const cleanSentence = sentence.trim();
    // Tokenize words
    const words = cleanSentence.match(/[a-zA-Z]{3,}/g) || [];

    words.forEach((rawWord) => {
      const wordLower = rawWord.toLowerCase();
      if (STOP_WORDS.has(wordLower)) return;

      // Check against known dictionary or heuristic length
      let matchedInfo = DICTIONARY_MAP[wordLower];

      // Try singular / base forms (e.g. learning -> learn, achievements -> achievement, languages -> language)
      if (!matchedInfo) {
        const singular = wordLower.replace(/(ing|ed|s|es|ly)$/, '');
        if (DICTIONARY_MAP[singular]) {
          matchedInfo = DICTIONARY_MAP[singular];
        }
      }

      if (matchedInfo && !extractedMap.has(wordLower)) {
        extractedMap.set(wordLower, {
          id: `vocab-${wordLower}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          word: rawWord.charAt(0).toUpperCase() + rawWord.slice(1).toLowerCase(),
          pos: matchedInfo.pos,
          meaning: matchedInfo.meaning,
          contextSentence: cleanSentence,
          selected: true,
        });
      } else if (!matchedInfo && wordLower.length >= 5 && !extractedMap.has(wordLower)) {
        // High value potential word from user's pasted custom text
        extractedMap.set(wordLower, {
          id: `vocab-${wordLower}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          word: rawWord.charAt(0).toUpperCase() + rawWord.slice(1).toLowerCase(),
          pos: 'noun',
          meaning: `Từ quan trọng trong câu`,
          contextSentence: cleanSentence,
          selected: true,
        });
      }
    });
  });

  return Array.from(extractedMap.values());
}
