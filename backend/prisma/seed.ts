import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu (Seeding DATN Database)...');

  // 1. Dọn dẹp dữ liệu cũ (Clean up tables)
  await prisma.studySession.deleteMany({});
  await prisma.userStats.deleteMany({});
  await prisma.card.deleteMany({});
  await prisma.deck.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Tạo Người dùng mẫu (Seed Users)
  const student = await prisma.user.create({
    data: {
      id: 'user-demo-1',
      name: 'Tram Nguyen',
      email: 'student@example.com',
      passwordHash,
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: 'user-admin-1',
      name: 'Admin Lingua',
      email: 'admin@example.com',
      passwordHash,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  console.log('✅ Đã tạo người dùng mẫu: student@example.com / admin@example.com');

  // 3. Khởi tạo Thống kê người dùng (User Stats)
  await prisma.userStats.create({
    data: {
      userId: student.id,
      totalCardsStudied: 145,
      totalStudyTimeSeconds: 3820,
      totalXp: 850,
      streakDays: 5,
      sessionsCompleted: 12,
      averageAccuracy: 92.5,
    },
  });

  // 4. Tạo các Bộ thẻ (Seed Decks & Cards)
  // Deck 1: Basic Communication
  const deck1 = await prisma.deck.create({
    data: {
      id: 'basic-comm',
      title: 'Basic Communication',
      description: 'Từ vựng tiếng Anh giao tiếp cơ bản và mẫu câu ghép từ hàng ngày cho người mới bắt đầu.',
      category: 'Beginner',
      color: 'from-violet-500 to-indigo-600',
      isPublic: true,
      creatorName: 'LinguaTeam',
      creatorId: admin.id,
      itemCount: 8,
      cards: {
        create: [
          {
            type: 'flashcard',
            front: 'Developer',
            back: 'Lập trình viên',
            phonetic: '/dɪˈvel.ə.pər/',
            exampleEn: 'He works as a fullstack developer.',
            exampleVi: 'Anh ấy làm việc như một lập trình viên fullstack.',
            orderIndex: 1,
          },
          {
            type: 'drag_drop',
            meaning: 'Tôi đang xây dựng một trang web.',
            grammarRule: 'S + am/is/are + V-ing + O (Hiện tại tiếp diễn - Present Continuous)',
            grammarExplanation: 'Thì Hiện tại tiếp diễn diễn tả hành động đang diễn ra tại thời điểm nói. Chủ ngữ "I" đi cùng to-be "am", động từ thêm đuôi -ing: "am building".',
            shuffledJson: JSON.stringify([
              { id: 'w1', word: 'a', type: 'other' },
              { id: 'w2', word: 'building', type: 'verb' },
              { id: 'w3', word: 'website', type: 'noun' },
              { id: 'w4', word: 'I', type: 'pronoun' },
              { id: 'w5', word: 'am', type: 'verb' },
            ]),
            correctOrderJson: JSON.stringify(['w4', 'w5', 'w2', 'w1', 'w3']),
            orderIndex: 2,
          },
          {
            type: 'flashcard',
            front: 'Beautiful',
            back: 'Xinh đẹp / Tuyệt đẹp',
            phonetic: '/ˈbjuː.tɪ.fəl/',
            exampleEn: 'The sunset over the beach is beautiful.',
            exampleVi: 'Hoàng hôn trên bãi biển thật đẹp.',
            orderIndex: 3,
          },
          {
            type: 'flashcard',
            front: 'Knowledge',
            back: 'Kiến thức / Sự hiểu biết',
            phonetic: '/ˈnɒl.ɪdʒ/',
            exampleEn: 'Knowledge is power.',
            exampleVi: 'Kiến thức là sức mạnh.',
            orderIndex: 4,
          },
          {
            type: 'drag_drop',
            meaning: 'Cô ấy thích học tiếng Anh.',
            grammarRule: 'S + love/like/enjoy + V-ing (Gerund - Danh động từ)',
            grammarExplanation: 'Sau các động từ chỉ sở thích như love, like, enjoy, hate, prefer... ta dùng Danh động từ (V-ing) để chỉ sở thích lâu dài: "loves learning". "She" là ngôi thứ 3 số ít nên động từ love thêm s -> "loves".',
            shuffledJson: JSON.stringify([
              { id: 'x1', word: 'She', type: 'pronoun' },
              { id: 'x2', word: 'loves', type: 'verb' },
              { id: 'x3', word: 'learning', type: 'verb' },
              { id: 'x4', word: 'English', type: 'noun' },
            ]),
            correctOrderJson: JSON.stringify(['x1', 'x2', 'x3', 'x4']),
            orderIndex: 5,
          },
          {
            type: 'flashcard',
            front: 'Opportunity',
            back: 'Cơ hội / Thời cơ',
            phonetic: '/ˌɒp.əˈtʃuː.nə.ti/',
            orderIndex: 6,
          },
          {
            type: 'flashcard',
            front: 'Success',
            back: 'Sự thành công',
            phonetic: '/səkˈses/',
            orderIndex: 7,
          },
          {
            type: 'flashcard',
            front: 'Happiness',
            back: 'Niềm hạnh phúc',
            phonetic: '/ˈhæp.i.nəs/',
            orderIndex: 8,
          },
        ],
      },
    },
  });

  // Deck 2: TOEIC Vocabulary
  await prisma.deck.create({
    data: {
      id: 'toeic-vocab',
      title: 'TOEIC Vocabulary',
      description: 'Từ vựng trọng tâm thường gặp trong đề thi TOEIC Listening & Reading.',
      category: 'Intermediate',
      color: 'from-rose-500 to-orange-500',
      isPublic: true,
      creatorName: 'ExamPro',
      creatorId: admin.id,
      itemCount: 6,
      cards: {
        create: [
          { type: 'flashcard', front: 'Negotiate', back: 'Đàm phán / Thương lượng', phonetic: '/nəˈɡəʊ.ʃi.eɪt/', orderIndex: 1 },
          { type: 'flashcard', front: 'Implement', back: 'Thực hiện / Thi hành kế hoạch', phonetic: '/ˈɪm.plɪ.ment/', orderIndex: 2 },
          {
            type: 'drag_drop',
            meaning: 'Công ty cần tuyển dụng nhân viên mới.',
            shuffledJson: JSON.stringify([
              { id: 't1', word: 'The', type: 'other' },
              { id: 't2', word: 'company', type: 'noun' },
              { id: 't3', word: 'needs', type: 'verb' },
              { id: 't4', word: 'new', type: 'adjective' },
              { id: 't5', word: 'to', type: 'other' },
              { id: 't6', word: 'hire', type: 'verb' },
              { id: 't7', word: 'employees', type: 'noun' },
            ]),
            correctOrderJson: JSON.stringify(['t1', 't2', 't3', 't5', 't6', 't4', 't7']),
            orderIndex: 3,
          },
          { type: 'flashcard', front: 'Revenue', back: 'Doanh thu', phonetic: '/ˈrev.ən.juː/', orderIndex: 4 },
          { type: 'flashcard', front: 'Strategy', back: 'Chiến lược kinh doanh', phonetic: '/ˈstræt.ə.dʒi/', orderIndex: 5 },
          { type: 'flashcard', front: 'Deadline', back: 'Hạn chót', phonetic: '/ˈded.laɪn/', orderIndex: 6 },
        ],
      },
    },
  });

  // Deck 3: Travel English
  await prisma.deck.create({
    data: {
      id: 'travel-english',
      title: 'Travel English',
      description: 'Cẩm nang từ vựng giao tiếp tại sân bay, khách sạn và du lịch quốc tế.',
      category: 'Beginner',
      color: 'from-emerald-500 to-teal-600',
      isPublic: true,
      creatorName: 'WanderlustEdu',
      creatorId: admin.id,
      itemCount: 6,
      cards: {
        create: [
          { type: 'flashcard', front: 'Passport', back: 'Hộ chiếu', phonetic: '/ˈpɑːs.pɔːt/', orderIndex: 1 },
          { type: 'flashcard', front: 'Departure', back: 'Khởi hành / Giờ cất cánh', phonetic: '/dɪˈpɑː.tʃər/', orderIndex: 2 },
          { type: 'flashcard', front: 'Luggage', back: 'Hành lý', phonetic: '/ˈlʌɡ.ɪdʒ/', orderIndex: 3 },
          { type: 'flashcard', front: 'Reservation', back: 'Đặt chỗ trước', phonetic: '/ˌrez.əˈveɪ.ʃən/', orderIndex: 4 },
          { type: 'flashcard', front: 'Customs', back: 'Hải quan kiểm tra', phonetic: '/ˈkʌs.təmz/', orderIndex: 5 },
          { type: 'flashcard', front: 'Boarding', back: 'Lên máy bay / tàu', phonetic: '/ˈbɔː.dɪŋ/', orderIndex: 6 },
        ],
      },
    },
  });

  // Deck 4: IELTS Writing Band 7+
  await prisma.deck.create({
    data: {
      id: 'ielts-writing',
      title: 'IELTS Writing Band 7+',
      description: 'Từ vựng học thuật và liên từ nối nâng cao cho bài viết IELTS Task 2.',
      category: 'Advanced',
      color: 'from-purple-600 to-pink-500',
      isPublic: true,
      creatorName: 'BandMaster',
      creatorId: admin.id,
      itemCount: 5,
      cards: {
        create: [
          { type: 'flashcard', front: 'Furthermore', back: 'Hơn nữa / Thêm vào đó', phonetic: '/ˌfɜː.ðəˈmɔːr/', orderIndex: 1 },
          { type: 'flashcard', front: 'Nevertheless', back: 'Tuy nhiên / Dù vậy', phonetic: '/ˌnev.ə.ðəˈles/', orderIndex: 2 },
          { type: 'flashcard', front: 'Consequently', back: 'Do đó / Kết quả là', phonetic: '/ˈkɒn.sɪ.kwənt.li/', orderIndex: 3 },
          { type: 'flashcard', front: 'Substantial', back: 'Đáng kể / Quan trọng', phonetic: '/səbˈstæn.ʃəl/', orderIndex: 4 },
          { type: 'flashcard', front: 'Alleviate', back: 'Giảm nhẹ / Làm dịu bớt', phonetic: '/əˈliː.vi.eɪt/', orderIndex: 5 },
        ],
      },
    },
  });

  // Deck 5: Business English

  await prisma.deck.create({
    data: {
      id: 'business-english',
      title: 'Business English',
      description: 'Thuật ngữ và từ vựng tiếng Anh chuyên ngành kinh tế, tài chính và quản trị.',
      category: 'Advanced',
      color: 'from-blue-600 to-cyan-500',
      isPublic: true,
      creatorName: 'CorpLingo',
      creatorId: admin.id,
      itemCount: 8,
      cards: {
        create: [
          { type: 'flashcard', front: 'Acquisition', back: 'Sáp nhập / Thu mua doanh nghiệp', phonetic: '/ˌæk.wɪˈzɪʃ.ən/', orderIndex: 1 },
          { type: 'flashcard', front: 'Stakeholder', back: 'Các bên liên quan', phonetic: '/ˈsteɪkˌhəʊl.dər/', orderIndex: 2 },
          { type: 'flashcard', front: 'Liability', back: 'Trách nhiệm pháp lý / Nghĩa vụ nợ', phonetic: '/ˌlaɪ.əˈbɪl.ə.ti/', orderIndex: 3 },
          { type: 'flashcard', front: 'Dividend', back: 'Cổ tức chia cho cổ đông', phonetic: '/ˈdɪv.ɪ.dend/', orderIndex: 4 },
          { type: 'flashcard', front: 'Benchmark', back: 'Tiêu chuẩn đối sánh chuẩn mực', phonetic: '/ˈbentʃ.mɑːk/', orderIndex: 5 },
          { type: 'flashcard', front: 'Leverage', back: 'Đòn bẩy tài chính', phonetic: '/ˈliː.vər.ɪdʒ/', orderIndex: 6 },
          { type: 'flashcard', front: 'Portfolio', back: 'Danh mục đầu tư', phonetic: '/ˌpɔːtˈfəʊ.li.əʊ/', orderIndex: 7 },
          { type: 'flashcard', front: 'Compliance', back: 'Sự tuân thủ pháp luật / Quy chế', phonetic: '/kəmˈplaɪ.əns/', orderIndex: 8 },
        ],
      },
    },
  });

  // 5. Phiên học mẫu (Seed Study Sessions)

  await prisma.studySession.create({
    data: {
      userId: student.id,
      deckId: deck1.id,
      mode: 'flashcard',
      cardsStudied: 8,
      correctCount: 8,
      accuracy: 100.0,
      timeSpentSeconds: 180,
      xpEarned: 100,
    },
  });

  console.log('🎉 Seeding hoàn tất! Database đã sẵn sàng phục vụ DATN.');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
