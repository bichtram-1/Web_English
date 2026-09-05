import { VOCAB_DICTIONARY } from '../data/vocabDictionary';

export type VocabCategoryType = 'vocab' | 'phrase' | 'grammar';
export type VocabPOS = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'idiom' | 'sentence' | 'grammar' | 'other';

export interface ExtractedVocabItem {
  id: string;
  word: string;
  pos: VocabPOS;
  categoryType: VocabCategoryType;
  meaning: string;
  contextSentence: string;
  grammarRule?: string;
  grammarExplanation?: string;
  phonetic?: string;
  selected: boolean;
}

// Built-in contextual English-Vietnamese vocabulary database with ~400+ high-frequency, daily, and academic terms
const DICTIONARY_MAP: Record<string, { pos: VocabPOS; meaning: string }> = {
  // Common Academic, IELTS & Everyday Terms
  academic: { pos: 'adjective', meaning: 'Thuộc học thuật, mang tính nghiên cứu' },
  achieve: { pos: 'verb', meaning: 'Đạt được, hoàn thành mục tiêu' },
  achievement: { pos: 'noun', meaning: 'Thành tích, thành tựu đáng tự hào' },
  acknowledge: { pos: 'verb', meaning: 'Công nhận, thừa nhận' },
  acquire: { pos: 'verb', meaning: 'Đạt được, thu nhận (kiến thức, kỹ năng)' },
  adapt: { pos: 'verb', meaning: 'Thích nghi, điều chỉnh cho phù hợp' },
  adequate: { pos: 'adjective', meaning: 'Đầy đủ, thỏa đáng' },
  adventure: { pos: 'noun', meaning: 'Cuộc phiêu lưu, trải nghiệm mạo hiểm' },
  advocate: { pos: 'verb', meaning: 'Ủng hộ, biện hộ' },
  aesthetic: { pos: 'adjective', meaning: 'Có tính thẩm mỹ, nghệ thuật' },
  algorithm: { pos: 'noun', meaning: 'Thuật toán, quy trình xử lý' },
  allow: { pos: 'verb', meaning: 'Cho phép, tạo điều kiện cho' },
  ambition: { pos: 'noun', meaning: 'Hoài bão, khát vọng' },
  analyze: { pos: 'verb', meaning: 'Phân tích kỹ lưỡng' },
  anticipate: { pos: 'verb', meaning: 'Dự đoán trước, lường trước' },
  apparent: { pos: 'adjective', meaning: 'Rõ ràng, hiển nhiên' },
  appreciate: { pos: 'verb', meaning: 'Trân trọng, đánh giá cao' },
  approach: { pos: 'noun', meaning: 'Phương pháp tiếp cận, hướng giải quyết' },
  artificial: { pos: 'adjective', meaning: 'Nhân tạo' },
  aspire: { pos: 'verb', meaning: 'Khao khát, vươn tới' },
  become: { pos: 'verb', meaning: 'Trở nên, trở thành' },
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
  comprehension: { pos: 'noun', meaning: 'Sự hiểu biết, khả năng đọc hiểu' },
  confidence: { pos: 'noun', meaning: 'Sự tự tin, niềm tin' },
  confident: { pos: 'adjective', meaning: 'Tự tin, tràn đầy niềm tin' },
  consequence: { pos: 'noun', meaning: 'Hậu quả, kết quả' },
  considerable: { pos: 'adjective', meaning: 'Đáng kể, to lớn' },
  consistent: { pos: 'adjective', meaning: 'Nhất quán, kiên định' },
  courage: { pos: 'noun', meaning: 'Lòng dũng cảm, sự can đảm' },
  creative: { pos: 'adjective', meaning: 'Sáng tạo, giàu trí tưởng tượng' },
  crucial: { pos: 'adjective', meaning: 'Vô cùng quan trọng, mang tính quyết định' },
  crucially: { pos: 'adverb', meaning: 'Một cách cốt yếu, mang tính quyết định' },
  curiosity: { pos: 'noun', meaning: 'Tính tò mò, ham học hỏi' },
  curious: { pos: 'adjective', meaning: 'Hiếu kỳ, tò mò tìm tòi' },
  decision: { pos: 'noun', meaning: 'Quyết định, sự lựa chọn' },
  dedicated: { pos: 'adjective', meaning: 'Tận tâm, cống hiến hết mình' },
  dedication: { pos: 'noun', meaning: 'Sự tận tụy, lòng cống hiến' },
  demonstrate: { pos: 'verb', meaning: 'Chứng minh, thể hiện rõ ràng' },
  determine: { pos: 'verb', meaning: 'Quyết định, xác định mục tiêu' },
  develop: { pos: 'verb', meaning: 'Phát triển, trau dồi' },
  development: { pos: 'noun', meaning: 'Sự phát triển, tiến triển' },
  diversity: { pos: 'noun', meaning: 'Sự đa dạng, phong phú' },
  dramatically: { pos: 'adverb', meaning: 'Một cách đột ngột, đáng kể' },
  education: { pos: 'noun', meaning: 'Nền giáo dục, sự đào tạo' },
  effective: { pos: 'adjective', meaning: 'Có hiệu lực, hiệu quả' },
  effectively: { pos: 'adverb', meaning: 'Một cách hiệu quả' },
  efficient: { pos: 'adjective', meaning: 'Hiệu quả, tối ưu thời gian và công sức' },
  effort: { pos: 'noun', meaning: 'Sự nỗ lực, cố gắng' },
  elaborate: { pos: 'adjective', meaning: 'Tỉ mỉ, chi tiết, kỹ lưỡng' },
  elementary: { pos: 'adjective', meaning: 'Cơ bản, sơ cấp' },
  eliminate: { pos: 'verb', meaning: 'Loại bỏ, triệt tiêu' },
  emerge: { pos: 'verb', meaning: 'Xuất hiện, nổi lên' },
  embrace: { pos: 'verb', meaning: 'Đón nhận nồng nhiệt, nắm bắt' },
  encourage: { pos: 'verb', meaning: 'Khuyến khích, động viên' },
  endurance: { pos: 'noun', meaning: 'Sức bền, sự dẻo dai kiên trì' },
  enhance: { pos: 'verb', meaning: 'Nâng cao, cải thiện chất lượng' },
  enthusiasm: { pos: 'noun', meaning: 'Sự nhiệt huyết, hăng say' },
  essential: { pos: 'adjective', meaning: 'Cốt yếu, thiết yếu không thể thiếu' },
  evaluate: { pos: 'verb', meaning: 'Đánh giá, định lượng' },
  excellence: { pos: 'noun', meaning: 'Sự xuất sắc, đỉnh cao' },
  experience: { pos: 'noun', meaning: 'Trải nghiệm, kinh nghiệm thực tế' },
  explore: { pos: 'verb', meaning: 'Khám phá, tìm hiểu' },
  extraordinary: { pos: 'adjective', meaning: 'Phi thường, đặc biệt xuất sắc' },
  facilitate: { pos: 'verb', meaning: 'Tạo điều kiện thuận lợi, hỗ trợ' },
  fascinating: { pos: 'adjective', meaning: 'Lôi cuốn, hấp dẫn tuyệt vời' },
  flexibility: { pos: 'noun', meaning: 'Sự linh hoạt, uyển chuyển' },
  flourish: { pos: 'verb', meaning: 'Phát triển hưng thịnh, nở rộ' },
  fluency: { pos: 'noun', meaning: 'Sự lưu loát, trôi chảy' },
  fluent: { pos: 'adjective', meaning: 'Trôi chảy, lưu loát' },
  foundation: { pos: 'noun', meaning: 'Nền tảng vững chắc, cơ sở' },
  freedom: { pos: 'noun', meaning: 'Sự tự do, giải phóng' },
  frequently: { pos: 'adverb', meaning: 'Thường xuyên, đều đặn' },
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
  individual: { pos: 'adjective', meaning: 'Riêng lẻ, mang tính cá nhân' },
  infinite: { pos: 'adjective', meaning: 'Vô hạn, không có điểm dừng' },
  ingredient: { pos: 'noun', meaning: 'Thành phần, yếu tố cấu thành' },
  initiative: { pos: 'noun', meaning: 'Sáng kiến, tính chủ động' },
  innovation: { pos: 'noun', meaning: 'Sự đổi mới sáng tạo, cách tân' },
  insight: { pos: 'noun', meaning: 'Cái nhìn sâu sắc, sự hiểu biết thấu đáo' },
  inspire: { pos: 'verb', meaning: 'Truyền cảm hứng, khơi dậy đam mê' },
  integrate: { pos: 'verb', meaning: 'Tích hợp, hòa nhập' },
  intelligence: { pos: 'noun', meaning: 'Trí thông minh, trí tuệ' },
  interactive: { pos: 'adjective', meaning: 'Có tính tương tác, hai chiều' },
  investigate: { pos: 'verb', meaning: 'Điều tra, nghiên cứu kỹ' },
  journey: { pos: 'noun', meaning: 'Hành trình, chặng đường dài' },
  knowledge: { pos: 'noun', meaning: 'Tri thức, sự hiểu biết' },
  language: { pos: 'noun', meaning: 'Ngôn ngữ, tiếng nói' },
  leadership: { pos: 'noun', meaning: 'Khả năng lãnh đạo, dẫn dắt' },
  magnitude: { pos: 'noun', meaning: 'Tầm vóc, quy mô' },
  maintain: { pos: 'verb', meaning: 'Duy trì, gìn giữ' },
  mastery: { pos: 'noun', meaning: 'Sự tinh thông, làm chủ kỹ năng' },
  meaningful: { pos: 'adjective', meaning: 'Đầy ý nghĩa, sâu sắc' },
  memory: { pos: 'noun', meaning: 'Trí nhớ, ký ức' },
  method: { pos: 'noun', meaning: 'Phương pháp, cách thức' },
  milestone: { pos: 'noun', meaning: 'Cột mốc quan trọng' },
  motivation: { pos: 'noun', meaning: 'Động lực thúc đẩy' },
  navigate: { pos: 'verb', meaning: 'Định hướng, điều hướng vượt qua' },
  necessity: { pos: 'noun', meaning: 'Sự cần thiết, điều bắt buộc' },
  opportunity: { pos: 'noun', meaning: 'Cơ hội thuận lợi' },
  optimistic: { pos: 'adjective', meaning: 'Lạc quan, tin tưởng tương lai' },
  overcome: { pos: 'verb', meaning: 'Vượt qua khó khăn, khắc phục' },
  passion: { pos: 'noun', meaning: 'Niềm đam mê cháy bỏng' },
  patience: { pos: 'noun', meaning: 'Sự kiên nhẫn, lòng nhẫn nại' },
  persevere: { pos: 'verb', meaning: 'Kiên trì, bền bỉ đến cùng' },
  perseverance: { pos: 'noun', meaning: 'Tính kiên trì, lòng nhẫn nại' },
  perspective: { pos: 'noun', meaning: 'Góc nhìn, quan điểm' },
  potential: { pos: 'noun', meaning: 'Tiềm năng to lớn' },
  practice: { pos: 'verb', meaning: 'Luyện tập, rèn luyện' },
  progress: { pos: 'noun', meaning: 'Sự tiến bộ, phát triển' },
  pronounce: { pos: 'verb', meaning: 'Phát âm chuẩn xác' },
  prosper: { pos: 'verb', meaning: 'Phát đạt, thịnh vượng' },
  pursue: { pos: 'verb', meaning: 'Theo đuổi (mục tiêu, đam mê)' },
  rapidly: { pos: 'adverb', meaning: 'Nhanh chóng, mau lẹ' },
  rarely: { pos: 'adverb', meaning: 'Hiếm khi, ít khi' },
  reflect: { pos: 'verb', meaning: 'Suy ngẫm, phản chiếu' },
  reinforce: { pos: 'verb', meaning: 'Củng cố, tăng cường' },
  remarkable: { pos: 'adjective', meaning: 'Đáng chú ý, phi thường' },
  resilient: { pos: 'adjective', meaning: 'Kiên cường, có khả năng phục hồi' },
  revolution: { pos: 'noun', meaning: 'Cuộc cách mạng, sự thay đổi toàn diện' },
  scholar: { pos: 'noun', meaning: 'Học giả, người nghiên cứu uyên bác' },
  significance: { pos: 'noun', meaning: 'Ý nghĩa to lớn, tầm quan trọng' },
  significantly: { pos: 'adverb', meaning: 'Một cách đáng kể, có ý nghĩa' },
  spontaneous: { pos: 'adjective', meaning: 'Tự phát, tự nhiên không gượng ép' },
  strategy: { pos: 'noun', meaning: 'Chiến lược thông minh' },
  successfully: { pos: 'adverb', meaning: 'Một cách thành công, thắng lợi' },
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

// Common stopwords to exclude from single-word extraction
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
 * Intelligent morphological heuristic to determine part of speech (POS) from English word affixes
 */
export function inferWordPartOfSpeech(word: string): VocabPOS {
  const w = word.toLowerCase().trim();

  // Adverbs: usually end in -ly (and longer than 4 chars e.g. quickly, easily, effectively)
  if (w.endsWith('ly') && w.length > 4 && !['ugly', 'holy', 'early', 'friendly', 'daily'].includes(w)) {
    return 'adverb';
  }

  // Adjectives: common adjective suffixes
  if (
    w.endsWith('able') ||
    w.endsWith('ible') ||
    w.endsWith('al') ||
    w.endsWith('ful') ||
    w.endsWith('ic') ||
    w.endsWith('ical') ||
    w.endsWith('ive') ||
    w.endsWith('ous') ||
    w.endsWith('less') ||
    w.endsWith('ish') ||
    w.endsWith('ant') ||
    w.endsWith('ent') ||
    w.endsWith('ary') ||
    w.endsWith('ory')
  ) {
    return 'adjective';
  }

  // Verbs: common verb suffixes
  if (
    w.endsWith('ize') ||
    w.endsWith('ise') ||
    w.endsWith('ate') ||
    w.endsWith('en') ||
    w.endsWith('ify') ||
    w.endsWith('fy')
  ) {
    return 'verb';
  }

  // Verbs: past participle / simple past (-ed) or present participle (-ing)
  if (w.endsWith('ed') && w.length > 4) {
    return 'verb';
  }
  if (w.endsWith('ing') && w.length > 5 && !['morning', 'evening', 'ceiling', 'building'].includes(w)) {
    return 'verb';
  }

  // Comparative / Superlative adjectives (e.g. faster, earlier, easier)
  if (
    (w.endsWith('er') || w.endsWith('est')) &&
    w.length >= 5 &&
    ['faster', 'slower', 'easier', 'earlier', 'harder', 'better', 'stronger', 'higher', 'lower', 'broadest', 'fastest'].includes(w)
  ) {
    return 'adjective';
  }

  // Nouns: common noun suffixes
  if (
    w.endsWith('tion') ||
    w.endsWith('sion') ||
    w.endsWith('ment') ||
    w.endsWith('ness') ||
    w.endsWith('ity') ||
    w.endsWith('ance') ||
    w.endsWith('ence') ||
    w.endsWith('ship') ||
    w.endsWith('hood') ||
    w.endsWith('dom') ||
    w.endsWith('ist') ||
    w.endsWith('ism') ||
    w.endsWith('ology') ||
    w.endsWith('ure') ||
    (w.endsWith('er') && w.length > 4) ||
    (w.endsWith('or') && w.length > 4)
  ) {
    return 'noun';
  }

  return 'noun'; // default fallback
}

/**
 * High-utility Phrasal Verbs, Collocations, and Idiomatic Expressions
 */
interface PhrasePattern {
  id: string;
  pattern: RegExp;
  displayTerm: string;
  meaning: string;
  pos: 'phrase' | 'idiom';
}

const PHRASE_PATTERNS: PhrasePattern[] = [
  // High-frequency Phrasal Verbs & Collocations
  {
    id: 'look-forward-to',
    pattern: /\b(look|looks|looking|looked)\s+forward\s+to\b/i,
    displayTerm: 'Look forward to (V-ing)',
    meaning: 'Háo hức mong đợi, trông chờ điều gì',
    pos: 'phrase',
  },
  {
    id: 'take-into-account',
    pattern: /\b(take|takes|taking|took|taken)\s+into\s+account\b/i,
    displayTerm: 'Take into account',
    meaning: 'Cân nhắc, tính đến (yếu tố, hoàn cảnh)',
    pos: 'phrase',
  },
  {
    id: 'take-advantage-of',
    pattern: /\b(take|takes|taking|took|taken)\s+advantage\s+of\b/i,
    displayTerm: 'Take advantage of',
    meaning: 'Tận dụng thời cơ, khai thác triệt để',
    pos: 'phrase',
  },
  {
    id: 'pay-attention-to',
    pattern: /\b(pay|pays|paying|paid)\s+attention\s+to\b/i,
    displayTerm: 'Pay attention to',
    meaning: 'Chú ý, lưu tâm tập trung đến',
    pos: 'phrase',
  },
  {
    id: 'make-progress',
    pattern: /\b(make|makes|making|made)\s+progress\b/i,
    displayTerm: 'Make progress',
    meaning: 'Có sự tiến bộ, phát triển vượt bậc',
    pos: 'phrase',
  },
  {
    id: 'make-decision',
    pattern: /\b(make|makes|making|made)\s+(a\s+)?decision\b/i,
    displayTerm: 'Make a decision',
    meaning: 'Đưa ra quyết định',
    pos: 'phrase',
  },
  {
    id: 'make-effort',
    pattern: /\b(make|makes|making|made)\s+(an?\s+)?effort\b/i,
    displayTerm: 'Make an effort',
    meaning: 'Nỗ lực, cố gắng hết mình',
    pos: 'phrase',
  },
  {
    id: 'play-role',
    pattern: /\b(play|plays|playing|played)\s+(an?\s+)?(important|crucial|vital|key|pivotal)?\s*role\b/i,
    displayTerm: 'Play an important role',
    meaning: 'Đóng một vai trò quan trọng, then chốt',
    pos: 'phrase',
  },
  {
    id: 'carry-out',
    pattern: /\b(carry|carries|carrying|carried)\s+out\b/i,
    displayTerm: 'Carry out',
    meaning: 'Tiến hành, thực thi (nghiên cứu, kế hoạch)',
    pos: 'phrase',
  },
  {
    id: 'come-up-with',
    pattern: /\b(come|comes|coming|came)\s+up\s+with\b/i,
    displayTerm: 'Come up with',
    meaning: 'Nảy ra ý tưởng, đề xuất sáng kiến mới',
    pos: 'phrase',
  },
  {
    id: 'figure-out',
    pattern: /\b(figure|figures|figuring|figured)\s+out\b/i,
    displayTerm: 'Figure out',
    meaning: 'Tìm ra cách giải quyết, hiểu thấu vấn đề',
    pos: 'phrase',
  },
  {
    id: 'point-out',
    pattern: /\b(point|points|pointing|pointed)\s+out\b/i,
    displayTerm: 'Point out',
    meaning: 'Chỉ ra, lưu ý vạch rõ',
    pos: 'phrase',
  },
  {
    id: 'give-up',
    pattern: /\b(give|gives|giving|gave|given)\s+up\b/i,
    displayTerm: 'Give up',
    meaning: 'Từ bỏ, bỏ cuộc giữa chừng',
    pos: 'phrase',
  },
  {
    id: 'break-down',
    pattern: /\b(break|breaks|breaking|broke|broken)\s+down\b/i,
    displayTerm: 'Break down',
    meaning: 'Hỏng hóc, suy sụp tinh thần, phân tích chi tiết',
    pos: 'phrase',
  },
  {
    id: 'set-up',
    pattern: /\b(set|sets|setting)\s+up\b/i,
    displayTerm: 'Set up',
    meaning: 'Thiết lập, thành lập, cài đặt hệ thống',
    pos: 'phrase',
  },
  {
    id: 'catch-up-with',
    pattern: /\b(catch|catches|catching|caught)\s+up\s+with\b/i,
    displayTerm: 'Catch up with',
    meaning: 'Bắt kịp, đuổi kịp tiến độ',
    pos: 'phrase',
  },
  {
    id: 'get-along-with',
    pattern: /\b(get|gets|getting|got)\s+along\s+with\b/i,
    displayTerm: 'Get along with',
    meaning: 'Hòa thuận, ăn ý với ai đó',
    pos: 'phrase',
  },
  {
    id: 'deal-with',
    pattern: /\b(deal|deals|dealing|dealt)\s+with\b/i,
    displayTerm: 'Deal with',
    meaning: 'Xử lý, đối phó, giải quyết vấn đề',
    pos: 'phrase',
  },
  {
    id: 'cope-with',
    pattern: /\b(cope|copes|coping|coped)\s+with\b/i,
    displayTerm: 'Cope with',
    meaning: 'Đương đầu, vượt qua áp lực khó khăn',
    pos: 'phrase',
  },
  {
    id: 'focus-on',
    pattern: /\b(focus|focuses|focusing|focused)\s+on\b/i,
    displayTerm: 'Focus on',
    meaning: 'Tập trung trọng tâm vào',
    pos: 'phrase',
  },
  {
    id: 'rely-on',
    pattern: /\b(rely|relies|relying|relied)\s+on\b/i,
    displayTerm: 'Rely on',
    meaning: 'Dựa dẫm, tin tưởng vào',
    pos: 'phrase',
  },
  {
    id: 'depend-on',
    pattern: /\b(depend|depends|depending|depended)\s+on\b/i,
    displayTerm: 'Depend on',
    meaning: 'Phụ thuộc vào, tùy thuộc vào',
    pos: 'phrase',
  },
  {
    id: 'lead-to',
    pattern: /\b(lead|leads|leading|led)\s+to\b/i,
    displayTerm: 'Lead to',
    meaning: 'Dẫn đến, gây ra kết quả',
    pos: 'phrase',
  },
  {
    id: 'result-in',
    pattern: /\b(result|results|resulting|resulted)\s+in\b/i,
    displayTerm: 'Result in',
    meaning: 'Mang lại kết quả là, dẫn đến',
    pos: 'phrase',
  },
  {
    id: 'bring-about',
    pattern: /\b(bring|brings|bringing|brought)\s+about\b/i,
    displayTerm: 'Bring about',
    meaning: 'Đem lại, mang lại sự thay đổi',
    pos: 'phrase',
  },
  {
    id: 'take-care-of',
    pattern: /\b(take|takes|taking|took|taken)\s+care\s+of\b/i,
    displayTerm: 'Take care of',
    meaning: 'Chăm sóc, quán xuyến chu đáo',
    pos: 'phrase',
  },
  {
    id: 'turn-out',
    pattern: /\b(turn|turns|turning|turned)\s+out\b/i,
    displayTerm: 'Turn out',
    meaning: 'Hóa ra là, trở nên thành ra',
    pos: 'phrase',
  },
  {
    id: 'find-out',
    pattern: /\b(find|finds|finding|found)\s+out\b/i,
    displayTerm: 'Find out',
    meaning: 'Khám phá ra, tìm hiểu thông tin',
    pos: 'phrase',
  },
  {
    id: 'stand-out',
    pattern: /\b(stand|stands|standing|stood)\s+out\b/i,
    displayTerm: 'Stand out',
    meaning: 'Nổi bật, xuất chúng hơn phần còn lại',
    pos: 'phrase',
  },

  // Transition & Discourse phrases
  {
    id: 'in-terms-of',
    pattern: /\bin\s+terms\s+of\b/i,
    displayTerm: 'In terms of',
    meaning: 'Xét về mặt, liên quan đến khía cạnh',
    pos: 'phrase',
  },
  {
    id: 'on-the-other-hand',
    pattern: /\bon\s+the\s+other\s+hand\b/i,
    displayTerm: 'On the other hand',
    meaning: 'Mặt khác, ngược lại',
    pos: 'phrase',
  },
  {
    id: 'as-a-result',
    pattern: /\bas\s+a\s+(result|consequence)\b/i,
    displayTerm: 'As a result',
    meaning: 'Hệ quả là, kết quả dẫn đến là',
    pos: 'phrase',
  },
  {
    id: 'in-addition-to',
    pattern: /\bin\s+addition\s+to\b/i,
    displayTerm: 'In addition to',
    meaning: 'Bên cạnh đó, ngoài ra',
    pos: 'phrase',
  },
  {
    id: 'in-spite-of',
    pattern: /\b(in\s+spite\s+of|regardless\s+of)\b/i,
    displayTerm: 'In spite of / Regardless of',
    meaning: 'Bất chấp, mặc cho dù có',
    pos: 'phrase',
  },

  // Common Idioms
  {
    id: 'piece-of-cake',
    pattern: /\b(a\s+)?piece\s+of\s+cake\b/i,
    displayTerm: 'A piece of cake',
    meaning: 'Dễ như trở bàn tay, cực kỳ đơn giản (Thành ngữ)',
    pos: 'idiom',
  },
  {
    id: 'break-a-leg',
    pattern: /\bbreak\s+a\s+leg\b/i,
    displayTerm: 'Break a leg',
    meaning: 'Chúc may mắn, chúc thành công (Thành ngữ sân khấu)',
    pos: 'idiom',
  },
  {
    id: 'once-in-a-blue-moon',
    pattern: /\bonce\s+in\s+a\s+blue\s+moon\b/i,
    displayTerm: 'Once in a blue moon',
    meaning: 'Rất hiếm khi, năm thì mười họa (Thành ngữ)',
    pos: 'idiom',
  },
];

/**
 * Grammar & Special Sentence Pattern Matchers
 */
interface GrammarPatternRule {
  id: string;
  name: string;
  rule: string;
  explanation: string;
  check: (sentence: string) => boolean;
}

const GRAMMAR_PATTERNS: GrammarPatternRule[] = [
  // 1. Inversion with "Not only... but also"
  {
    id: 'inversion-not-only',
    name: 'Not only... but also (Đảo ngữ nhấn mạnh)',
    rule: 'Not only + Trợ động từ/Be + S + V, but S + also + V...',
    explanation: 'Cấu trúc đảo ngữ mang tính nhấn mạnh: "Không những... mà còn...".',
    check: (s) => /\bnot\s+only\b.*\b(but\s+also|but\b.*\balso)\b/i.test(s),
  },

  // 2. Inversion with "Hardly / Scarcely / No sooner"
  {
    id: 'inversion-time',
    name: 'Hardly... when / No sooner... than (Đảo ngữ thời gian)',
    rule: 'Hardly/Scarcely + had + S + V3/ed + when... / No sooner + had + S + V3/ed + than...',
    explanation: 'Diễn tả hành động vừa mới dứt thì hành động khác xảy ra ngay: "Vừa mới... thì đã...".',
    check: (s) =>
      /\b(hardly|scarcely)\b.*\bwhen\b/i.test(s) || /\bno\s+sooner\b.*\bthan\b/i.test(s),
  },

  // 3. Inversion with negative adverbs (Never / Rarely / Seldom)
  {
    id: 'inversion-negative',
    name: 'Đảo ngữ với Trạng từ phủ định (Never, Rarely, Seldom)',
    rule: 'Never / Rarely / Seldom / Under no circumstances + Trợ động từ + S + V',
    explanation: 'Đảo ngữ đưa trạng từ phủ định lên đầu câu để nhấn mạnh mức độ hiếm có hoặc tuyệt đối không.',
    check: (s) =>
      /\b(never|rarely|seldom|under\s+no\s+circumstances)\s+(have|had|did|do|does|can|could|will|would|is|are|was|were)\b/i.test(
        s
      ),
  },

  // 4. Third Conditional (Câu điều kiện loại 3)
  {
    id: 'conditional-type-3',
    name: 'Câu điều kiện loại 3 (Third Conditional)',
    rule: 'If + S + had + V3/ed, S + would/could/might + have + V3/ed',
    explanation: 'Diễn tả giả định trái ngược với thực tế đã xảy ra trong quá khứ, thường mang hàm ý tiếc nuối.',
    check: (s) =>
      /\bif\b.*\bhad\s+([a-z]+ed|[a-z]+en|been|done|seen|gone|taken|come|given)\b.*\b(would|could|might)\s+have\b/i.test(
        s
      ) ||
      /\bhad\s+[a-z]+\s+([a-z]+ed|[a-z]+en|been|done|seen|gone|taken)\b.*\b(would|could|might)\s+have\b/i.test(
        s
      ),
  },

  // 5. Second Conditional (Câu điều kiện loại 2)
  {
    id: 'conditional-type-2',
    name: 'Câu điều kiện loại 2 (Second Conditional)',
    rule: 'If + S + V2/ed (were), S + would/could + V (nguyên thể)',
    explanation: 'Diễn tả giả định không có thật hoặc trái ngược với thực tế ở hiện tại.',
    check: (s) =>
      /\bif\b.*\b(were|did|[a-z]+ed)\b.*\b(would|could|might)\s+[a-z]+\b/i.test(s) &&
      !/\bwould\s+have\b/i.test(s),
  },

  // 6. First Conditional (Câu điều kiện loại 1)
  {
    id: 'conditional-type-1',
    name: 'Câu điều kiện loại 1 (First Conditional)',
    rule: 'If + S + V(hiện tại), S + will/can/may + V (nguyên thể)',
    explanation: 'Diễn tả điều kiện và kết quả có thể xảy ra ở hiện tại hoặc tương lai.',
    check: (s) =>
      /\bif\b.*\b(will|can|may|shall)\s+[a-z]+\b/i.test(s) &&
      !/\b(would|could|had)\b/i.test(s),
  },

  // 7. Double Comparative (So sánh kép càng... càng)
  {
    id: 'double-comparative',
    name: 'So sánh kép: Càng... thì càng (Double Comparative)',
    rule: 'The + comparative (more / -er) + S + V, the + comparative + S + V',
    explanation: 'Diễn tả hai sự việc có sự biến đổi phụ thuộc song song: "Càng... thì càng...".',
    check: (s) =>
      /\bthe\s+(more|less|[a-z]{3,}er)\b[^,.!?]+,\s*the\s+(more|less|[a-z]{3,}er)\b/i.test(s),
  },

  // 8. Cleft sentence (Câu chẻ nhấn mạnh)
  {
    id: 'cleft-sentence',
    name: 'Câu chẻ nhấn mạnh (Cleft Sentence: It is/was... that)',
    rule: 'It is / It was + Thành phần cần nhấn mạnh + that / who + Mệnh đề',
    explanation: 'Nhấn mạnh vào một chủ ngữ, tân ngữ hoặc trạng ngữ cụ thể trong câu: "Chính là... mà...".',
    check: (s) =>
      /\b(it\s+is|it\s+was)\s+[^,.!?]{3,30}\s+(that|who)\s+[a-z]+/i.test(s),
  },

  // 9. Concession clause (Mệnh đề nhượng bộ: Although / Despite)
  {
    id: 'concession-clause',
    name: 'Mệnh đề nhượng bộ: Mặc dù (Although / Despite)',
    rule: 'Although / Even though + S + V, S + V / Despite / In spite of + Noun/V-ing, S + V',
    explanation: 'Diễn tả sự tương phản nhượng bộ giữa hai vế câu: "Mặc dù... nhưng...".',
    check: (s) =>
      /\b(although|even\s+though)\b[^,]+,\s*[a-z]+/i.test(s) ||
      /\b(despite|in\s+spite\s+of)\b/i.test(s),
  },

  // 10. Too... to / Enough to (Cấu trúc chỉ mức độ)
  {
    id: 'too-enough',
    name: 'Cấu trúc mức độ: Too... to / Enough to',
    rule: 'S + be + too + Adj + to V (Quá không thể) / S + be + Adj + enough + to V (Đủ để làm gì)',
    explanation: 'Diễn tả mức độ của đặc tính dẫn tới kết quả có thể hoặc không thể làm điều gì.',
    check: (s) =>
      /\btoo\s+[a-z]{3,}\s+to\s+[a-z]{3,}\b/i.test(s) ||
      /\b[a-z]{3,}\s+enough\s+to\s+[a-z]{3,}\b/i.test(s),
  },

  // 11. So... that / Such... that (Quá đến nỗi mà)
  {
    id: 'so-such-that',
    name: 'Cấu trúc kết quả: So... that / Such... that (Đến nỗi mà)',
    rule: 'S + be + so + Adj + that + Clause / S + V + such + (a/an) + Adj + Noun + that + Clause',
    explanation: 'Diễn tả mức độ mãnh liệt của hành động hay tính chất dẫn đến một kết quả cụ thể.',
    check: (s) =>
      /\bso\s+[a-z]{3,}\s+that\s+[a-z]+/i.test(s) ||
      /\bsuch\s+(an?\s+)?[a-z]{3,}\s+[a-z]{3,}\s+that\b/i.test(s),
  },

  // 12. Used to vs Be/Get used to (Thói quen quá khứ vs Đang quen dần)
  {
    id: 'used-to',
    name: 'Cấu trúc thói quen: Used to / Be used to',
    rule: 'used to + V (từng có thói quen trong quá khứ) / be/get used to + V-ing (quen dần với việc gì)',
    explanation: 'Phân biệt thói quen đã chấm dứt trong quá khứ và sự thích nghi quen thuộc ở hiện tại.',
    check: (s) =>
      /\bused\s+to\s+[a-z]{3,}\b/i.test(s) ||
      /\b(am|is|are|was|were|get|got|getting)\s+used\s+to\s+[a-z]+ing\b/i.test(s),
  },

  // 13. Causative form (Thể nhờ bảo: Have/Get something done)
  {
    id: 'causative-form',
    name: 'Thể nhờ bảo / Truyền khiến (Causative Form)',
    rule: 'have + something + V3/ed / get + something + V3/ed',
    explanation: 'Diễn tả việc nhờ, thuê hoặc yêu cầu người khác làm việc gì cho mình.',
    check: (s) =>
      /\b(have|has|had|get|gets|got)\s+[^,.!?]{2,20}\s+([a-z]+ed|[a-z]+en|done|fixed|repaired|cleaned|built)\b/i.test(
        s
      ),
  },

  // 14. Wish & Subjunctive (Câu ước & Giả định)
  {
    id: 'wish-subjunctive',
    name: 'Câu mong ước & Thể giả định (Wish / It is high time)',
    rule: 'S + wish + S + V-past / It is high time + S + V-past',
    explanation: 'Diễn tả mong ước điều gì đó trái ngược với hiện tại hoặc đã đến lúc cấp bách phải làm việc gì.',
    check: (s) =>
      /\b(wish|wishes|wished)\b.*\b(could|would|had|were)\b/i.test(s) ||
      /\bit\s+is\s+(high\s+)?time\s+[a-z]+\s+[a-z]+ed\b/i.test(s),
  },
];

/**
 * Safely partition text into manageable chunks <= maxLen (default 380 chars)
 * respecting paragraph boundaries, sentence stops, and clauses to prevent API limits.
 */
function splitTextIntoSafeChunks(text: string, maxLen = 380): { text: string; isParaEnd: boolean }[] {
  const paragraphs = text.split(/\r?\n+/);
  const chunks: { text: string; isParaEnd: boolean }[] = [];

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const rawPara = paragraphs[pIdx].trim();
    if (!rawPara) continue;

    if (rawPara.length <= maxLen) {
      chunks.push({ text: rawPara, isParaEnd: true });
      continue;
    }

    // Split paragraph by sentence endings (. ? !)
    const sentences = rawPara.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [rawPara];
    let current = '';

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;

      if ((current + ' ' + s).trim().length <= maxLen) {
        current = (current + ' ' + s).trim();
      } else {
        if (current) {
          chunks.push({ text: current, isParaEnd: false });
          current = '';
        }

        // If single sentence itself is huge, split by commas/semicolons
        if (s.length > maxLen) {
          const subClauses = s.split(/([,;:]\s+)/);
          let subCurrent = '';
          for (const sub of subClauses) {
            if ((subCurrent + sub).length <= maxLen) {
              subCurrent += sub;
            } else {
              if (subCurrent.trim()) {
                chunks.push({ text: subCurrent.trim(), isParaEnd: false });
              }
              subCurrent = sub;
            }
          }
          if (subCurrent.trim()) {
            current = subCurrent.trim();
          }
        } else {
          current = s;
        }
      }
    }

    if (current.trim()) {
      chunks.push({ text: current.trim(), isParaEnd: true });
    }
  }

  return chunks;
}

/**
 * Translate a single chunk <= 380 chars via online translation API
 */
async function translateSingleChunk(chunk: string): Promise<string> {
  const clean = chunk.trim();
  if (!clean) return '';

  try {
    const encoded = encodeURIComponent(clean);
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|vi`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText?.trim();
      if (
        translated &&
        !translated.toUpperCase().includes('MYMEMORY WARNING') &&
        !translated.includes('QUERY LENGTH LIMIT EXCEEDED')
      ) {
        return translated;
      }
    }
  } catch (e) {
    console.warn('Chunk translation error, fallback to original:', e);
  }

  return clean;
}

/**
 * Translate English text to Vietnamese using Smart Sentence Chunking.
 * Supports long articles, IELTS/TOEIC readings of 2000-5000+ characters with zero limits.
 */
export async function translateText(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';

  // For short text <= 380 chars, translate in 1 quick shot
  if (clean.length <= 380) {
    return translateSingleChunk(clean);
  }

  // Split into safe chunks <= 380 chars respecting sentence & paragraph boundaries
  const chunks = splitTextIntoSafeChunks(clean, 380);
  if (chunks.length === 0) return clean;

  try {
    const translatedParts = await Promise.all(
      chunks.map(async (c) => {
        const trans = await translateSingleChunk(c.text);
        return trans + (c.isParaEnd ? '\n\n' : ' ');
      })
    );
    return translatedParts.join('').trim();
  } catch (e) {
    console.warn('Error during chunked translation:', e);
    return clean;
  }
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
        !translated.includes('QUERY LENGTH LIMIT EXCEEDED') &&
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
 * Advanced English NLP Extractor:
 * 1. Analyzes Grammar & Special Sentence Patterns (Conditionals, Inversions, Cleft Sentences, etc.)
 * 2. Extracts Phrasal Verbs, Collocations, and Idiomatic Expressions
 * 3. Extracts Key Vocabulary (Nouns, Verbs, Adjectives, Adverbs) with morphological POS inference
 */
export function extractKeyVocabulary(paragraph: string): ExtractedVocabItem[] {
  if (!paragraph || !paragraph.trim()) return [];

  // Split text into distinct sentences
  const sentences = paragraph.match(/[^.!?\n]+[.!?\n]+/g) || [paragraph];

  const extractedList: ExtractedVocabItem[] = [];
  const seenGrammarIds = new Set<string>();
  const seenPhraseIds = new Set<string>();
  const seenWordKeys = new Set<string>();

  sentences.forEach((sentence, sIdx) => {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) return;

    // --- STEP 1: Detect Grammar & Sentence Patterns ---
    for (const pattern of GRAMMAR_PATTERNS) {
      if (!seenGrammarIds.has(pattern.id) && pattern.check(cleanSentence)) {
        seenGrammarIds.add(pattern.id);
        extractedList.push({
          id: `grammar-${pattern.id}-${sIdx}-${Date.now()}`,
          word: pattern.name,
          pos: 'grammar',
          categoryType: 'grammar',
          meaning: pattern.explanation,
          grammarRule: pattern.rule,
          grammarExplanation: pattern.explanation,
          contextSentence: cleanSentence,
          selected: true,
        });
      }
    }

    // --- STEP 2: Detect Phrasal Verbs, Collocations & Idioms ---
    for (const phrase of PHRASE_PATTERNS) {
      if (!seenPhraseIds.has(phrase.id) && phrase.pattern.test(cleanSentence)) {
        seenPhraseIds.add(phrase.id);
        extractedList.push({
          id: `phrase-${phrase.id}-${sIdx}-${Date.now()}`,
          word: phrase.displayTerm,
          pos: phrase.pos,
          categoryType: 'phrase',
          meaning: phrase.meaning,
          contextSentence: cleanSentence,
          selected: true,
        });
      }
    }

    // --- STEP 3: Tokenize and Extract Single Words with Accurate POS ---
    const words = cleanSentence.match(/[a-zA-Z]{3,}/g) || [];

    words.forEach((rawWord) => {
      const wordLower = rawWord.toLowerCase();
      if (STOP_WORDS.has(wordLower)) return;
      if (seenWordKeys.has(wordLower)) return;

      // 1. Direct match in DICTIONARY_MAP
      let matchedInfo = DICTIONARY_MAP[wordLower];

      // 2. Direct match in VOCAB_DICTIONARY
      if (!matchedInfo) {
        const vocabItem = VOCAB_DICTIONARY.find((v) => v.term.toLowerCase() === wordLower);
        if (vocabItem && vocabItem.definition) {
          matchedInfo = {
            pos: (vocabItem.pos as VocabPOS) || 'noun',
            meaning: vocabItem.definition,
          };
        }
      }

      // 3. Try base forms (e.g. learning -> learn, achieved -> achieve, challenges -> challenge, earlier -> early)
      if (!matchedInfo) {
        const candidates = [
          wordLower.replace(/(ing|ed|s|es|ly)$/, ''),
          wordLower.replace(/(d|s)$/, ''),
          wordLower.replace(/ed$/, 'e'),
          wordLower.replace(/ing$/, 'e'),
          wordLower.replace(/ies$/, 'y'),
          wordLower.replace(/ier$/, 'y'),
        ];
        for (const base of candidates) {
          if (!base || base === wordLower) continue;
          if (DICTIONARY_MAP[base]) {
            matchedInfo = DICTIONARY_MAP[base];
            break;
          }
          const baseVocabItem = VOCAB_DICTIONARY.find((v) => v.term.toLowerCase() === base);
          if (baseVocabItem && baseVocabItem.definition) {
            matchedInfo = {
              pos: (baseVocabItem.pos as VocabPOS) || 'noun',
              meaning: baseVocabItem.definition,
            };
            break;
          }
        }
      }

      if (matchedInfo) {
        seenWordKeys.add(wordLower);
        extractedList.push({
          id: `vocab-${wordLower}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          word: rawWord.charAt(0).toUpperCase() + rawWord.slice(1).toLowerCase(),
          pos: matchedInfo.pos,
          categoryType: 'vocab',
          meaning: matchedInfo.meaning,
          contextSentence: cleanSentence,
          selected: true,
        });
      } else if (wordLower.length >= 5) {
        // Fallback for custom user words: Infer accurate POS from morphological affixes
        seenWordKeys.add(wordLower);
        const inferredPos = inferWordPartOfSpeech(wordLower);
        const posLabelVi =
          inferredPos === 'verb'
            ? 'Động từ quan trọng'
            : inferredPos === 'adjective'
            ? 'Tính từ quan trọng'
            : inferredPos === 'adverb'
            ? 'Trạng từ quan trọng'
            : 'Từ vựng quan trọng';

        extractedList.push({
          id: `vocab-${wordLower}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          word: rawWord.charAt(0).toUpperCase() + rawWord.slice(1).toLowerCase(),
          pos: inferredPos,
          categoryType: 'vocab',
          meaning: `${posLabelVi} (trong ngữ cảnh)`,
          contextSentence: cleanSentence,
          selected: true,
        });
      }
    });
  });

  return extractedList;
}

/**
 * Background auto-enrichment for newly extracted words that lack a full Vietnamese definition.
 * Translates up to 8 custom words in parallel and seamlessly updates the vocabulary list.
 */
export async function enrichExtractedItemsMeanings(
  items: ExtractedVocabItem[],
  onUpdate: (updater: (prev: ExtractedVocabItem[]) => ExtractedVocabItem[]) => void
) {
  const pendingWords = items.filter(
    (item) => item.categoryType === 'vocab' && item.meaning.includes('quan trọng (trong ngữ cảnh)')
  );

  if (pendingWords.length === 0) return;

  const toTranslate = pendingWords.slice(0, 8);
  for (const item of toTranslate) {
    try {
      const translated = await translateSingleWord(item.word);
      if (translated && translated.toLowerCase() !== item.word.toLowerCase()) {
        onUpdate((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, meaning: translated } : it))
        );
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Intelligent difficulty estimation based on extracted items (Grammar, Phrases, and Vocabulary complexity)
 */
export function detectDeckLevel(items: ExtractedVocabItem[]): {
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  reason: string;
} {
  const selected = items.filter((i) => i.selected);
  const targetItems = selected.length > 0 ? selected : items;

  const grammarItems = targetItems.filter((i) => i.categoryType === 'grammar');
  const phraseItems = targetItems.filter((i) => i.categoryType === 'phrase');

  // Advanced checks: Inversions, 3rd conditionals, double comparatives, or academic/C1 words
  const hasAdvancedGrammar = grammarItems.some(
    (i) =>
      i.word.includes('Đảo ngữ') ||
      i.word.includes('loại 3') ||
      i.word.includes('So sánh kép') ||
      i.word.includes('Câu chẻ') ||
      i.word.includes('giả định')
  );

  const advancedVocabWords = new Set([
    'academic', 'extraordinary', 'breakthrough', 'algorithm', 'artificial', 'comprehension',
    'curiosity', 'dedication', 'dramatically', 'endurance', 'facilitate', 'fundamental',
    'illuminate', 'initiative', 'innovation', 'magnitude', 'persevere', 'perseverance',
    'perspective', 'resilient', 'revolution', 'significance', 'spontaneous', 'sustainable',
    'ultimate', 'unleash',
  ]);

  const hasAdvancedVocab = targetItems.some(
    (i) => i.categoryType === 'vocab' && advancedVocabWords.has(i.word.toLowerCase())
  );

  if (hasAdvancedGrammar || (hasAdvancedVocab && grammarItems.length >= 1)) {
    return {
      level: 'Advanced',
      reason: 'Phát hiện cấu trúc ngữ pháp nâng cao (Đảo ngữ / Câu điều kiện loại 3) hoặc từ vựng học thuật C1/C2.',
    };
  }

  // Intermediate checks: Phrasal verbs, conditionals, or intermediate vocabulary
  if (phraseItems.length >= 1 || grammarItems.length >= 1 || targetItems.length >= 10) {
    return {
      level: 'Intermediate',
      reason: 'Phát hiện cụm động từ (Phrasal Verbs) / Collocations hoặc cấu trúc câu trung cấp B1/B2.',
    };
  }

  // Beginner
  return {
    level: 'Beginner',
    reason: 'Chủ yếu là từ vựng giao tiếp và đời sống hàng ngày cơ bản (A1/A2).',
  };
}

/**
 * Automatically suggests a descriptive, relevant title for the generated deck
 */
export function generateSmartDeckTitle(items: ExtractedVocabItem[], inputText: string): string {
  const selected = items.filter((i) => i.selected);
  const targetItems = selected.length > 0 ? selected : items;
  const count = targetItems.length;

  const grammarItems = targetItems.filter((i) => i.categoryType === 'grammar');
  const phraseItems = targetItems.filter((i) => i.categoryType === 'phrase');
  const vocabItems = targetItems.filter((i) => i.categoryType === 'vocab');

  if (grammarItems.length > 0 && vocabItems.length > 0) {
    const keyWord = vocabItems[0]?.word || 'Vocab';
    return `Ngữ Pháp & Từ Vựng: ${keyWord} (${count} mục)`;
  }

  if (phraseItems.length > 0) {
    const keyPhrase = phraseItems[0]?.word || 'Phrases';
    return `Cụm từ & Collocations: ${keyPhrase} (${count} thẻ)`;
  }

  if (vocabItems.length > 0) {
    const w1 = vocabItems[0]?.word || 'Vocabulary';
    const w2 = vocabItems[1]?.word;
    return w2 ? `Từ vựng: ${w1} & ${w2} (${count} từ)` : `Từ vựng: ${w1} (${count} từ)`;
  }

  return `Bộ thẻ trích xuất (${count} thẻ)`;
}

