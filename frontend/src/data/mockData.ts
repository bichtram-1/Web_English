export type WordType = 'noun' | 'verb' | 'adjective' | 'pronoun' | 'other';

export interface FlashcardItem {
  id: number;
  type: 'flashcard';
  front: string;
  back: string;
}

export interface DragDropWord {
  id: string;
  word: string;
  type: WordType;
}

export interface DragDropItem {
  id: number;
  type: 'drag_drop';
  meaning: string;
  shuffled: DragDropWord[];
  correctOrder: string[];
  grammarRule?: string;
  grammarExplanation?: string;
  grammarNote?: string;
}

export type CardItem = FlashcardItem | DragDropItem;

export interface Deck {
  id: string;
  title: string;
  creator: string;
  itemCount: number;
  category: string;
  color: string;
  cards: CardItem[];
}

export const mockDecks: Deck[] = [
  {
    id: 'basic-comm',
    title: 'Basic Communication',
    creator: 'LinguaTeam',
    itemCount: 20,
    category: 'Beginner',
    color: 'from-violet-500 to-indigo-600',
    cards: [
      { id: 1, type: 'flashcard', front: 'Developer', back: 'Lập trình viên' },
      {
        id: 2,
        type: 'drag_drop',
        meaning: 'Tôi đang xây dựng một trang web.',
        grammarRule: 'S + am/is/are + V-ing + O (Hiện tại tiếp diễn - Present Continuous)',
        grammarExplanation: 'Thì Hiện tại tiếp diễn diễn tả hành động đang diễn ra tại thời điểm nói. Chủ ngữ "I" đi cùng to-be "am", động từ thêm đuôi -ing: "am building".',
        shuffled: [
          { id: 'w1', word: 'a', type: 'other' },
          { id: 'w2', word: 'building', type: 'verb' },
          { id: 'w3', word: 'website', type: 'noun' },
          { id: 'w4', word: 'I', type: 'pronoun' },
          { id: 'w5', word: 'am', type: 'verb' },
        ],
        correctOrder: ['w4', 'w5', 'w2', 'w1', 'w3'],
      },
      { id: 3, type: 'flashcard', front: 'Beautiful', back: 'Đẹp' },
      { id: 4, type: 'flashcard', front: 'Knowledge', back: 'Kiến thức' },
      { id: 5, type: 'flashcard', front: 'Achievement', back: 'Thành tích' },
      {
        id: 6,
        type: 'drag_drop',
        meaning: 'Cô ấy thích học tiếng Anh.',
        grammarRule: 'S + love/like/enjoy + V-ing (Gerund - Danh động từ)',
        grammarExplanation: 'Sau các động từ chỉ sở thích như love, like, enjoy, hate, prefer... ta dùng Danh động từ (V-ing) để chỉ sở thích lâu dài: "loves learning". "She" là ngôi thứ 3 số ít nên động từ love thêm s -> "loves".',
        shuffled: [
          { id: 'x1', word: 'She', type: 'pronoun' },
          { id: 'x2', word: 'loves', type: 'verb' },
          { id: 'x3', word: 'learning', type: 'verb' },
          { id: 'x4', word: 'English', type: 'noun' },
        ],
        correctOrder: ['x1', 'x2', 'x3', 'x4'],
      },
      { id: 7, type: 'flashcard', front: 'Challenge', back: 'Thách thức' },
      { id: 8, type: 'flashcard', front: 'Opportunity', back: 'Cơ hội' },
      {
        id: 9,
        type: 'drag_drop',
        meaning: 'Anh ấy làm việc chăm chỉ mỗi ngày.',
        grammarRule: 'S + V(s/es) + Adv + Time expression (Hiện tại đơn - Present Simple)',
        grammarExplanation: 'Thì Hiện tại đơn diễn tả thói quen hoặc hành động lặp đi lặp lại hàng ngày ("every day"). Chủ ngữ "He" là ngôi 3 số ít nên "work" thêm "s" -> "works". Từ "hard" đóng vai trò trạng từ đứng sau động từ.',
        shuffled: [
          { id: 'y1', word: 'He', type: 'pronoun' },
          { id: 'y2', word: 'hard', type: 'adjective' },
          { id: 'y3', word: 'works', type: 'verb' },
          { id: 'y4', word: 'every', type: 'other' },
          { id: 'y5', word: 'day', type: 'noun' },
        ],
        correctOrder: ['y1', 'y3', 'y2', 'y4', 'y5'],
      },
      { id: 10, type: 'flashcard', front: 'Success', back: 'Thành công' },
      { id: 11, type: 'flashcard', front: 'Freedom', back: 'Tự do' },
      { id: 12, type: 'flashcard', front: 'Friendship', back: 'Tình bạn' },
      { id: 13, type: 'flashcard', front: 'Happiness', back: 'Hạnh phúc' },
      { id: 14, type: 'flashcard', front: 'Courage', back: 'Dũng cảm' },
      { id: 15, type: 'flashcard', front: 'Patience', back: 'Kiên nhẫn' },
      { id: 16, type: 'flashcard', front: 'Respect', back: 'Tôn trọng' },
      { id: 17, type: 'flashcard', front: 'Creativity', back: 'Sáng tạo' },
      { id: 18, type: 'flashcard', front: 'Kindness', back: 'Lòng tốt' },
      { id: 19, type: 'flashcard', front: 'Ambition', back: 'Tham vọng' },
      { id: 20, type: 'flashcard', front: 'Wisdom', back: 'Sự khôn ngoan' },
    ],
  },
  {
    id: 'toeic-vocab',
    title: 'TOEIC Vocabulary',
    creator: 'ExamPro',
    itemCount: 35,
    category: 'Intermediate',
    color: 'from-rose-500 to-orange-500',
    cards: [
      { id: 1, type: 'flashcard', front: 'Negotiate', back: 'Đàm phán' },
      { id: 2, type: 'flashcard', front: 'Implement', back: 'Thực hiện' },
      {
        id: 3,
        type: 'drag_drop',
        meaning: 'Công ty cần tuyển dụng nhân viên mới.',
        grammarRule: 'S + need + to-V (infinitive) + Adj + Noun',
        grammarExplanation: 'Động từ "need" khi diễn tả nhu cầu làm gì của người/tổ chức theo sau bởi động từ nguyên mẫu có to ("to hire"). Tính từ "new" đứng trước danh từ "employees" để bổ nghĩa.',
        shuffled: [
          { id: 't1', word: 'The', type: 'other' },
          { id: 't2', word: 'company', type: 'noun' },
          { id: 't3', word: 'needs', type: 'verb' },
          { id: 't4', word: 'new', type: 'adjective' },
          { id: 't5', word: 'to', type: 'other' },
          { id: 't6', word: 'hire', type: 'verb' },
          { id: 't7', word: 'employees', type: 'noun' },
        ],
        correctOrder: ['t1', 't2', 't3', 't5', 't6', 't4', 't7'],
      },
      { id: 4, type: 'flashcard', front: 'Revenue', back: 'Doanh thu' },
      { id: 5, type: 'flashcard', front: 'Strategy', back: 'Chiến lược' },
      { id: 6, type: 'flashcard', front: 'Deadline', back: 'Hạn chót' },
      { id: 7, type: 'flashcard', front: 'Proposal', back: 'Đề xuất' },
      { id: 8, type: 'flashcard', front: 'Contract', back: 'Hợp đồng' },
      { id: 9, type: 'flashcard', front: 'Efficient', back: 'Hiệu quả' },
      { id: 10, type: 'flashcard', front: 'Collaborate', back: 'Hợp tác' },
      { id: 11, type: 'flashcard', front: 'Delegate', back: 'Ủy quyền' },
      { id: 12, type: 'flashcard', front: 'Forecast', back: 'Dự báo' },
    ],
  },
  {
    id: 'travel-english',
    title: 'Travel English',
    creator: 'WanderlustEdu',
    itemCount: 18,
    category: 'Beginner',
    color: 'from-emerald-500 to-teal-600',
    cards: [
      { id: 1, type: 'flashcard', front: 'Passport', back: 'Hộ chiếu' },
      { id: 2, type: 'flashcard', front: 'Departure', back: 'Khởi hành' },
      { id: 3, type: 'flashcard', front: 'Luggage', back: 'Hành lý' },
      { id: 4, type: 'flashcard', front: 'Reservation', back: 'Đặt chỗ' },
      { id: 5, type: 'flashcard', front: 'Customs', back: 'Hải quan' },
      { id: 6, type: 'flashcard', front: 'Boarding', back: 'Lên máy bay' },
      { id: 7, type: 'flashcard', front: 'Itinerary', back: 'Lịch trình' },
      { id: 8, type: 'flashcard', front: 'Currency', back: 'Tiền tệ' },
    ],
  },
  {
    id: 'business-english',
    title: 'Business English',
    creator: 'CorpLingo',
    itemCount: 42,
    category: 'Advanced',
    color: 'from-blue-600 to-cyan-500',
    cards: [
      { id: 1, type: 'flashcard', front: 'Acquisition', back: 'Sáp nhập / Thu mua' },
      { id: 2, type: 'flashcard', front: 'Stakeholder', back: 'Các bên liên quan' },
      { id: 3, type: 'flashcard', front: 'Liability', back: 'Trách nhiệm pháp lý' },
      { id: 4, type: 'flashcard', front: 'Dividend', back: 'Cổ tức' },
      { id: 5, type: 'flashcard', front: 'Benchmark', back: 'Tiêu chuẩn so sánh' },
      { id: 6, type: 'flashcard', front: 'Leverage', back: 'Đòn bẩy tài chính' },
      { id: 7, type: 'flashcard', front: 'Portfolio', back: 'Danh mục đầu tư' },
      { id: 8, type: 'flashcard', front: 'Compliance', back: 'Tuân thủ quy định' },
    ],
  },
  {
    id: 'ielts-writing',
    title: 'IELTS Writing Band 7+',
    creator: 'BandMaster',
    itemCount: 28,
    category: 'Advanced',
    color: 'from-purple-600 to-pink-500',
    cards: [
      { id: 1, type: 'flashcard', front: 'Furthermore', back: 'Hơn nữa / Thêm vào đó' },
      { id: 2, type: 'flashcard', front: 'Nevertheless', back: 'Tuy nhiên / Dù vậy' },
      { id: 3, type: 'flashcard', front: 'Consequently', back: 'Do đó / Kết quả là' },
      { id: 4, type: 'flashcard', front: 'Substantial', back: 'Đáng kể / Quan trọng' },
      { id: 5, type: 'flashcard', front: 'Predominantly', back: 'Chủ yếu / Phần lớn' },
      { id: 6, type: 'flashcard', front: 'Adversely', back: 'Bất lợi / Tiêu cực' },
      { id: 7, type: 'flashcard', front: 'Phenomenon', back: 'Hiện tượng' },
      { id: 8, type: 'flashcard', front: 'Alleviate', back: 'Giảm nhẹ / Xoa dịu' },
    ],
  },
  {
    id: 'daily-phrases',
    title: 'Daily Phrases',
    creator: 'SpeedLearn',
    itemCount: 15,
    category: 'Beginner',
    color: 'from-amber-500 to-yellow-400',
    cards: [
      { id: 1, type: 'flashcard', front: 'How are you?', back: 'Bạn có khỏe không?' },
      { id: 2, type: 'flashcard', front: 'See you later', back: 'Hẹn gặp lại' },
      { id: 3, type: 'flashcard', front: 'Good morning', back: 'Chào buổi sáng' },
      { id: 4, type: 'flashcard', front: 'Thank you so much', back: 'Cảm ơn rất nhiều' },
      { id: 5, type: 'flashcard', front: 'I understand', back: 'Tôi hiểu' },
      { id: 6, type: 'flashcard', front: 'Never mind', back: 'Không sao' },
      { id: 7, type: 'flashcard', front: 'Take care', back: 'Giữ gìn sức khỏe' },
      { id: 8, type: 'flashcard', front: 'Excuse me', back: 'Xin lỗi / Cho hỏi' },
    ],
  },
];
