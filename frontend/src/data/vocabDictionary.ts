export interface VocabSuggestion {
  term: string;
  definition: string;
  pos?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'sentence' | 'idiom';
  phonetic?: string;
  category?: string;
  grammarRule?: string;
  grammarExplanation?: string;
  type?: 'flashcard' | 'drag_drop';
}

export const VOCAB_DICTIONARY: VocabSuggestion[] = [
  // --- Fruits & Vegetables (Trái cây & Nông sản) ---
  { term: 'Apple', definition: 'Quả táo, trái táo', pos: 'noun', phonetic: '/ˈæp.əl/', category: 'Trái cây' },
  { term: 'Banana', definition: 'Quả chuối, nải chuối', pos: 'noun', phonetic: '/bəˈnɑː.nə/', category: 'Trái cây' },
  { term: 'Orange', definition: 'Quả cam, trái cam', pos: 'noun', phonetic: '/ˈɒr.ɪndʒ/', category: 'Trái cây' },
  { term: 'Grape', definition: 'Quả nho, chùm nho', pos: 'noun', phonetic: '/ɡreɪp/', category: 'Trái cây' },
  { term: 'Strawberry', definition: 'Quả dâu tây', pos: 'noun', phonetic: '/ˈstrɔː.bər.i/', category: 'Trái cây' },
  { term: 'Watermelon', definition: 'Quả dưa hấu', pos: 'noun', phonetic: '/ˈwɔː.təˌmel.ən/', category: 'Trái cây' },
  { term: 'Mango', definition: 'Quả xoài', pos: 'noun', phonetic: '/ˈmæŋ.ɡəʊ/', category: 'Trái cây' },
  { term: 'Pineapple', definition: 'Quả dứa, trái thơm, khóm', pos: 'noun', phonetic: '/ˈpaɪnˌæp.əl/', category: 'Trái cây' },
  { term: 'Lemon', definition: 'Quả chanh vàng', pos: 'noun', phonetic: '/ˈlem.ən/', category: 'Trái cây' },
  { term: 'Lime', definition: 'Quả chanh xanh', pos: 'noun', phonetic: '/laɪm/', category: 'Trái cây' },
  { term: 'Peach', definition: 'Quả đào', pos: 'noun', phonetic: '/piːtʃ/', category: 'Trái cây' },
  { term: 'Pear', definition: 'Quả lê', pos: 'noun', phonetic: '/peər/', category: 'Trái cây' },
  { term: 'Cherry', definition: 'Quả anh đào, cherry', pos: 'noun', phonetic: '/ˈtʃer.i/', category: 'Trái cây' },
  { term: 'Papaya', definition: 'Quả đu đủ', pos: 'noun', phonetic: '/pəˈpaɪ.ə/', category: 'Trái cây' },
  { term: 'Coconut', definition: 'Quả dừa, trái dừa', pos: 'noun', phonetic: '/ˈkəʊ.kə.nʌt/', category: 'Trái cây' },
  { term: 'Avocado', definition: 'Quả bơ', pos: 'noun', phonetic: '/ˌæv.əˈkɑː.dəʊ/', category: 'Trái cây' },
  { term: 'Blueberry', definition: 'Quả việt quất', pos: 'noun', phonetic: '/ˈbluːˌber.i/', category: 'Trái cây' },
  { term: 'Guava', definition: 'Quả ổi', pos: 'noun', phonetic: '/ˈɡwɑː.və/', category: 'Trái cây' },
  { term: 'Dragon fruit', definition: 'Quả thanh long', pos: 'noun', phonetic: '/ˈdræɡ.ən fruːt/', category: 'Trái cây' },
  { term: 'Durian', definition: 'Quả sầu riêng', pos: 'noun', phonetic: '/ˈdʊə.ri.ən/', category: 'Trái cây' },
  { term: 'Jackfruit', definition: 'Quả mít', pos: 'noun', phonetic: '/ˈdʒæk.fruːt/', category: 'Trái cây' },
  { term: 'Passion fruit', definition: 'Quả chanh dây, lạc tiên', pos: 'noun', phonetic: '/ˈpæʃ.ən fruːt/', category: 'Trái cây' },
  { term: 'Kiwi', definition: 'Quả kiwi', pos: 'noun', phonetic: '/ˈkiː.wiː/', category: 'Trái cây' },
  { term: 'Tomato', definition: 'Quả cà chua', pos: 'noun', phonetic: '/təˈmɑː.təʊ/', category: 'Rau củ' },
  { term: 'Potato', definition: 'Củ khoai tây', pos: 'noun', phonetic: '/pəˈteɪ.təʊ/', category: 'Rau củ' },
  { term: 'Carrot', definition: 'Củ cà rốt', pos: 'noun', phonetic: '/ˈkær.ət/', category: 'Rau củ' },

  // --- Animals (Động vật) ---
  { term: 'Cat', definition: 'Con mèo', pos: 'noun', phonetic: '/kæt/', category: 'Động vật' },
  { term: 'Dog', definition: 'Con chó', pos: 'noun', phonetic: '/dɒɡ/', category: 'Động vật' },
  { term: 'Bird', definition: 'Con chim', pos: 'noun', phonetic: '/bɜːd/', category: 'Động vật' },
  { term: 'Fish', definition: 'Con cá', pos: 'noun', phonetic: '/fɪʃ/', category: 'Động vật' },
  { term: 'Elephant', definition: 'Con voi', pos: 'noun', phonetic: '/ˈel.ɪ.fənt/', category: 'Động vật' },
  { term: 'Lion', definition: 'Sư tử', pos: 'noun', phonetic: '/ˈlaɪ.ən/', category: 'Động vật' },
  { term: 'Tiger', definition: 'Con hổ, con cọp', pos: 'noun', phonetic: '/ˈtaɪ.ɡər/', category: 'Động vật' },
  { term: 'Monkey', definition: 'Con khỉ', pos: 'noun', phonetic: '/ˈmʌŋ.ki/', category: 'Động vật' },
  { term: 'Rabbit', definition: 'Con thỏ', pos: 'noun', phonetic: '/ˈræb.ɪt/', category: 'Động vật' },
  { term: 'Dolphin', definition: 'Cá heo', pos: 'noun', phonetic: '/ˈdɒl.fɪn/', category: 'Động vật' },
  { term: 'Penguin', definition: 'Chim cánh cụt', pos: 'noun', phonetic: '/ˈpeŋ.ɡwɪn/', category: 'Động vật' },

  // --- Daily Life & Education ---
  { term: 'Book', definition: 'Quyển sách, cuốn sách', pos: 'noun', phonetic: '/bʊk/', category: 'Đời sống' },
  { term: 'Computer', definition: 'Máy tính, máy vi tính', pos: 'noun', phonetic: '/kəmˈpjuː.tər/', category: 'Công nghệ' },
  { term: 'Coffee', definition: 'Cà phê, tách cà phê', pos: 'noun', phonetic: '/ˈkɒf.i/', category: 'Đời sống' },
  { term: 'Tea', definition: 'Trà, tách trà thơm', pos: 'noun', phonetic: '/tiː/', category: 'Đời sống' },
  { term: 'School', definition: 'Trường học, ngôi trường', pos: 'noun', phonetic: '/skuːl/', category: 'Giáo dục' },
  { term: 'Teacher', definition: 'Giáo viên, thầy cô giáo', pos: 'noun', phonetic: '/ˈtiː.tʃər/', category: 'Giáo dục' },
  { term: 'Student', definition: 'Học sinh, sinh viên', pos: 'noun', phonetic: '/ˈstjuː.dənt/', category: 'Giáo dục' },

  // --- Common & Daily Flashcards ---
  { term: 'Developer', definition: 'Lập trình viên, người phát triển phần mềm', pos: 'noun', phonetic: '/dɪˈvel.ə.pər/', category: 'Công nghệ' },
  { term: 'Beautiful', definition: 'Xinh đẹp, tuyệt đẹp', pos: 'adjective', phonetic: '/ˈbjuː.tɪ.fəl/', category: 'Đời sống' },
  { term: 'Knowledge', definition: 'Kiến thức, tri thức, sự hiểu biết', pos: 'noun', phonetic: '/ˈnɒl.ɪdʒ/', category: 'Học tập' },
  { term: 'Achievement', definition: 'Thành tích, thành tựu đạt được', pos: 'noun', phonetic: '/əˈtʃiːv.mənt/', category: 'Học tập' },
  { term: 'Challenge', definition: 'Thách thức, thử thách khó khăn', pos: 'noun', phonetic: '/ˈtʃæl.ɪndʒ/', category: 'Đời sống' },
  { term: 'Opportunity', definition: 'Cơ hội thuận lợi, thời cơ', pos: 'noun', phonetic: '/ˌɒp.əˈtjuː.nə.ti/', category: 'Công việc' },
  { term: 'Success', definition: 'Sự thành công, thắng lợi', pos: 'noun', phonetic: '/səkˈses/', category: 'Đời sống' },
  { term: 'Freedom', definition: 'Sự tự do, quyền tự do', pos: 'noun', phonetic: '/ˈfriː.dəm/', category: 'Đời sống' },
  { term: 'Friendship', definition: 'Tình bạn, tình hữu nghị', pos: 'noun', phonetic: '/ˈfrend.ʃɪp/', category: 'Đời sống' },
  { term: 'Happiness', definition: 'Niềm hạnh phúc, sự vui vẻ', pos: 'noun', phonetic: '/ˈhæp.i.nəs/', category: 'Cảm xúc' },
  { term: 'Courage', definition: 'Lòng dũng cảm, sự can đảm', pos: 'noun', phonetic: '/ˈkʌr.ɪdʒ/', category: 'Phẩm chất' },
  { term: 'Patience', definition: 'Sự kiên nhẫn, lòng nhẫn nại', pos: 'noun', phonetic: '/ˈpeɪ.ʃəns/', category: 'Phẩm chất' },
  { term: 'Respect', definition: 'Sự tôn trọng, kính trọng', pos: 'noun', phonetic: '/rɪˈspekt/', category: 'Phẩm chất' },
  { term: 'Creativity', definition: 'Tính sáng tạo, óc sáng tạo', pos: 'noun', phonetic: '/ˌkriː.eɪˈtɪv.ə.ti/', category: 'Kỹ năng' },
  { term: 'Kindness', definition: 'Lòng tốt, sự tử tế, ân cần', pos: 'noun', phonetic: '/ˈkaɪnd.nəs/', category: 'Phẩm chất' },
  { term: 'Ambition', definition: 'Hoài bão, khát vọng vươn lên', pos: 'noun', phonetic: '/æmˈbɪʃ.ən/', category: 'Phẩm chất' },
  { term: 'Wisdom', definition: 'Sự khôn ngoan, trí tuệ minh triết', pos: 'noun', phonetic: '/ˈwɪz.dəm/', category: 'Phẩm chất' },
  { term: 'Experience', definition: 'Kinh nghiệm, trải nghiệm thực tế', pos: 'noun', phonetic: '/ɪkˈspɪə.ri.əns/', category: 'Kỹ năng' },
  { term: 'Confidence', definition: 'Sự tự tin, niềm tin vào bản thân', pos: 'noun', phonetic: '/ˈkɒn.fɪ.dəns/', category: 'Cảm xúc' },
  { term: 'Motivation', definition: 'Động lực thúc đẩy, sự khích lệ', pos: 'noun', phonetic: '/ˌməʊ.tɪˈveɪ.ʃən/', category: 'Tâm lý' },
  { term: 'Community', definition: 'Cộng đồng, tập thể xã hội', pos: 'noun', phonetic: '/kəˈmjuː.nə.ti/', category: 'Xã hội' },
  { term: 'Environment', definition: 'Môi trường sống, môi trường tự nhiên', pos: 'noun', phonetic: '/ɪnˈvaɪ.rən.mənt/', category: 'Môi trường' },
  { term: 'Technology', definition: 'Công nghệ, kỹ thuật hiện đại', pos: 'noun', phonetic: '/tekˈnɒl.ə.dʒi/', category: 'Công nghệ' },
  { term: 'Education', definition: 'Nền giáo dục, sự rèn luyện', pos: 'noun', phonetic: '/ˌedʒ.ʊˈkeɪ.ʃən/', category: 'Giáo dục' },
  { term: 'Information', definition: 'Thông tin, dữ liệu thông báo', pos: 'noun', phonetic: '/ˌɪn.fəˈmeɪ.ʃən/', category: 'Công nghệ' },
  { term: 'Performance', definition: 'Hiệu suất làm việc, buổi biểu diễn', pos: 'noun', phonetic: '/pəˈfɔː.məns/', category: 'Công việc' },
  { term: 'Responsibility', definition: 'Trách nhiệm, bổn phận', pos: 'noun', phonetic: '/rɪˌspɒn.sɪˈbɪl.ə.ti/', category: 'Phẩm chất' },
  { term: 'Communication', definition: 'Giao tiếp, truyền đạt thông tin', pos: 'noun', phonetic: '/kəˌmjuː.nɪˈkeɪ.ʃən/', category: 'Kỹ năng' },
  { term: 'Relationship', definition: 'Mối quan hệ, tình thân', pos: 'noun', phonetic: '/rɪˈleɪ.ʃən.ʃɪp/', category: 'Xã hội' },
  { term: 'Solution', definition: 'Giải pháp, hướng khắc phục vấn đề', pos: 'noun', phonetic: '/səˈluː.ʃən/', category: 'Công việc' },
  { term: 'Improvement', definition: 'Sự cải thiện, tiến bộ', pos: 'noun', phonetic: '/ɪmˈpruːv.mənt/', category: 'Học tập' },
  { term: 'Leadership', definition: 'Năng lực lãnh đạo, sự dẫn dắt', pos: 'noun', phonetic: '/ˈliː.də.ʃɪp/', category: 'Kỹ năng' },
  { term: 'Independence', definition: 'Sự độc lập, tự chủ', pos: 'noun', phonetic: '/ˌɪn.dɪˈpen.dəns/', category: 'Phẩm chất' },
  { term: 'Inspiration', definition: 'Nguồn cảm hứng sáng tạo', pos: 'noun', phonetic: '/ˌɪn.spɪˈreɪ.ʃən/', category: 'Tâm lý' },
  { term: 'Conversation', definition: 'Cuộc trò chuyện, đàm thoại', pos: 'noun', phonetic: '/ˌkɒn.vəˈseɪ.ʃən/', category: 'Giao tiếp' },

  // --- TOEIC & Business English ---
  { term: 'Negotiate', definition: 'Đàm phán, thương lượng hợp đồng', pos: 'verb', phonetic: '/nəˈɡəʊ.ʃi.eɪt/', category: 'TOEIC / Kinh doanh' },
  { term: 'Implement', definition: 'Triển khai, thực thi kế hoạch', pos: 'verb', phonetic: '/ˈɪm.plɪ.ment/', category: 'TOEIC / Kinh doanh' },
  { term: 'Revenue', definition: 'Doanh thu, tổng thu nhập', pos: 'noun', phonetic: '/ˈrev.ən.juː/', category: 'TOEIC / Kinh doanh' },
  { term: 'Strategy', definition: 'Chiến lược phát triển dài hạn', pos: 'noun', phonetic: '/ˈstræt.ə.dʒi/', category: 'TOEIC / Kinh doanh' },
  { term: 'Deadline', definition: 'Hạn chót, thời hạn hoàn thành', pos: 'noun', phonetic: '/ˈded.laɪn/', category: 'TOEIC / Kinh doanh' },
  { term: 'Proposal', definition: 'Bản đề xuất, kế hoạch dự thảo', pos: 'noun', phonetic: '/prəˈpəʊ.zəl/', category: 'TOEIC / Kinh doanh' },
  { term: 'Contract', definition: 'Bản hợp đồng cam kết pháp lý', pos: 'noun', phonetic: '/ˈkɒn.trækt/', category: 'TOEIC / Kinh doanh' },
  { term: 'Efficient', definition: 'Có hiệu suất cao, tối ưu thời gian', pos: 'adjective', phonetic: '/ɪˈfɪʃ.ənt/', category: 'TOEIC / Kinh doanh' },
  { term: 'Collaborate', definition: 'Cộng tác, cùng phối hợp làm việc', pos: 'verb', phonetic: '/kəˈlæb.ə.reɪt/', category: 'TOEIC / Kinh doanh' },
  { term: 'Delegate', definition: 'Ủy quyền, phân công nhiệm vụ', pos: 'verb', phonetic: '/ˈdel.ɪ.ɡeɪt/', category: 'TOEIC / Kinh doanh' },
  { term: 'Forecast', definition: 'Dự báo xu hướng tài chính / thị trường', pos: 'verb', phonetic: '/ˈfɔː.kɑːst/', category: 'TOEIC / Kinh doanh' },
  { term: 'Acquisition', definition: 'Sáp nhập, mua lại doanh nghiệp', pos: 'noun', phonetic: '/ˌæk.wɪˈzɪʃ.ən/', category: 'Kinh doanh' },
  { term: 'Stakeholder', definition: 'Bên liên quan, cổ đông, đối tác', pos: 'noun', phonetic: '/ˈsteɪkˌhəʊl.dər/', category: 'Kinh doanh' },
  { term: 'Liability', definition: 'Trách nhiệm pháp lý, khoản nợ phải trả', pos: 'noun', phonetic: '/ˌlaɪ.əˈbɪl.ə.ti/', category: 'Kinh doanh' },
  { term: 'Dividend', definition: 'Tiền cổ tức chia cho cổ đông', pos: 'noun', phonetic: '/ˈdɪv.ɪ.dend/', category: 'Kinh doanh' },
  { term: 'Benchmark', definition: 'Tiêu chuẩn đối sánh, mốc chuẩn', pos: 'noun', phonetic: '/ˈbentʃ.mɑːk/', category: 'Kinh doanh' },
  { term: 'Leverage', definition: 'Tận dụng tối đa, đòn bẩy tài chính', pos: 'verb', phonetic: '/ˈliː.vər.ɪdʒ/', category: 'Kinh doanh' },
  { term: 'Portfolio', definition: 'Danh mục đầu tư, hồ sơ năng lực', pos: 'noun', phonetic: '/pɔːtˈfəʊ.li.əʊ/', category: 'Kinh doanh' },
  { term: 'Compliance', definition: 'Sự tuân thủ pháp luật và quy chế', pos: 'noun', phonetic: '/kəmˈplaɪ.əns/', category: 'Kinh doanh' },
  { term: 'Productivity', definition: 'Năng suất lao động', pos: 'noun', phonetic: '/ˌprɒd.ʌkˈtɪv.ə.ti/', category: 'Kinh doanh' },
  { term: 'Expenditure', definition: 'Khoản chi tiêu, tổng chi phí', pos: 'noun', phonetic: '/ɪkˈspen.dɪ.tʃər/', category: 'Kinh doanh' },
  { term: 'Restructure', definition: 'Tái cơ cấu, cải tổ tổ chức', pos: 'verb', phonetic: '/ˌriːˈstrʌk.tʃər/', category: 'Kinh doanh' },

  // --- IELTS Band 7+ & Academic ---
  { term: 'Furthermore', definition: 'Hơn nữa, thêm vào đó, vả lại', pos: 'adverb', phonetic: '/ˌfɜː.ðəˈmɔːr/', category: 'IELTS Writing' },
  { term: 'Nevertheless', definition: 'Tuy nhiên, dù sao đi nữa', pos: 'adverb', phonetic: '/ˌnev.ə.ðəˈles/', category: 'IELTS Writing' },
  { term: 'Consequently', definition: 'Do đó, vì vậy, kết quả là', pos: 'adverb', phonetic: '/ˈkɒn.sɪ.kwənt.li/', category: 'IELTS Writing' },
  { term: 'Substantial', definition: 'Đáng kể, có giá trị to lớn', pos: 'adjective', phonetic: '/səbˈstæn.ʃəl/', category: 'IELTS Writing' },
  { term: 'Predominantly', definition: 'Phần lớn, chủ yếu, chiếm ưu thế', pos: 'adverb', phonetic: '/prɪˈdɒm.ɪ.nənt.li/', category: 'IELTS Writing' },
  { term: 'Adversely', definition: 'Bất lợi, tiêu cực, có hại', pos: 'adverb', phonetic: '/ˈæd.vɜːs.li/', category: 'IELTS Writing' },
  { term: 'Phenomenon', definition: 'Hiện tượng, sự việc đặc biệt', pos: 'noun', phonetic: '/fəˈnɒm.ɪ.nən/', category: 'IELTS Academic' },
  { term: 'Alleviate', definition: 'Giảm bớt, xoa dịu (nỗi đau, áp lực)', pos: 'verb', phonetic: '/əˈliː.vi.eɪt/', category: 'IELTS Academic' },
  { term: 'Comprehensive', definition: 'Toàn diện, bao quát mọi mặt', pos: 'adjective', phonetic: '/ˌkɒm.prɪˈhen.sɪv/', category: 'IELTS Academic' },
  { term: 'Deteriorate', definition: 'Trở nên tồi tệ hơn, suy thoái', pos: 'verb', phonetic: '/dɪˈtɪə.ri.ə.reɪt/', category: 'IELTS Academic' },
  { term: 'Feasible', definition: 'Khả thi, có thể thực hiện được', pos: 'adjective', phonetic: '/ˈfiː.zə.bəl/', category: 'IELTS Academic' },
  { term: 'Hypothesis', definition: 'Giả thuyết khoa học', pos: 'noun', phonetic: '/haɪˈpɒθ.ə.sɪs/', category: 'IELTS Academic' },
  { term: 'Inevitable', definition: 'Tất yếu, không thể tránh khỏi', pos: 'adjective', phonetic: '/ɪnˈev.ɪ.tə.bəl/', category: 'IELTS Academic' },
  { term: 'Mitigate', definition: 'Làm giảm nhẹ mức độ tác hại', pos: 'verb', phonetic: '/ˈmɪt.ɪ.ɡeɪt/', category: 'IELTS Academic' },
  { term: 'Pragmatic', definition: 'Thực tế, thực dụng, coi trọng hiệu quả', pos: 'adjective', phonetic: '/præɡˈmæt.ɪk/', category: 'IELTS Academic' },
  { term: 'Scrutinize', definition: 'Kiểm tra kỹ lưỡng, soi xét cẩn thận', pos: 'verb', phonetic: '/ˈskruː.tɪ.naɪz/', category: 'IELTS Academic' },
  { term: 'Unprecedented', definition: 'Chưa từng có tiền lệ trong lịch sử', pos: 'adjective', phonetic: '/ʌnˈpres.ɪ.den.tɪd/', category: 'IELTS Academic' },
  { term: 'Ubiquitous', definition: 'Phổ biến khắp mọi nơi, nhan nhản', pos: 'adjective', phonetic: '/juːˈbɪk.wɪ.təs/', category: 'IELTS Academic' },

  // --- Travel & Everyday Phrases ---
  { term: 'Passport', definition: 'Hộ chiếu xuất nhập cảnh', pos: 'noun', phonetic: '/ˈpɑːs.pɔːt/', category: 'Du lịch' },
  { term: 'Departure', definition: 'Giờ khởi hành, sự rời đi', pos: 'noun', phonetic: '/dɪˈpɑː.tʃər/', category: 'Du lịch' },
  { term: 'Luggage', definition: 'Hành lý mang theo', pos: 'noun', phonetic: '/ˈlʌɡ.ɪdʒ/', category: 'Du lịch' },
  { term: 'Reservation', definition: 'Sự đặt chỗ trước (phòng, vé)', pos: 'noun', phonetic: '/ˌrez.əˈveɪ.ʃən/', category: 'Du lịch' },
  { term: 'Customs', definition: 'Hải quan, cơ quan kiểm soát biên giới', pos: 'noun', phonetic: '/ˈkʌs.təmz/', category: 'Du lịch' },
  { term: 'Boarding pass', definition: 'Thẻ lên máy bay', pos: 'phrase', category: 'Du lịch' },
  { term: 'Itinerary', definition: 'Lịch trình chuyến đi', pos: 'noun', phonetic: '/aɪˈtɪn.ər.ər.i/', category: 'Du lịch' },
  { term: 'Currency', definition: 'Tiền tệ, đồng tiền lưu hành', pos: 'noun', phonetic: '/ˈkʌr.ən.si/', category: 'Du lịch' },
  { term: 'How are you?', definition: 'Bạn có khỏe không?', pos: 'sentence', category: 'Giao tiếp hàng ngày' },
  { term: 'See you later', definition: 'Hẹn gặp lại bạn sau nhé', pos: 'sentence', category: 'Giao tiếp hàng ngày' },
  { term: 'Good morning', definition: 'Chào buổi sáng', pos: 'sentence', category: 'Giao tiếp hàng ngày' },
  { term: 'Thank you so much', definition: 'Cảm ơn bạn rất nhiều', pos: 'sentence', category: 'Giao tiếp hàng ngày' },
  { term: 'I understand', definition: 'Tôi đã hiểu vấn đề rồi', pos: 'sentence', category: 'Giao tiếp hàng ngày' },
  { term: 'Never mind', definition: 'Không sao đâu, đừng bận tâm', pos: 'phrase', category: 'Giao tiếp hàng ngày' },
  { term: 'Take care', definition: 'Hãy giữ gìn sức khỏe nhé', pos: 'phrase', category: 'Giao tiếp hàng ngày' },
  { term: 'Excuse me', definition: 'Xin lỗi / Làm ơn cho tôi hỏi', pos: 'phrase', category: 'Giao tiếp hàng ngày' },

  // --- Grammar Sentences & Rules (Drag & Drop Compatible) ---
  {
    term: 'I am building a website',
    definition: 'Tôi đang xây dựng một trang web.',
    pos: 'sentence',
    type: 'drag_drop',
    grammarRule: 'S + am/is/are + V-ing + O (Hiện tại tiếp diễn)',
    grammarExplanation: 'Thì Hiện tại tiếp diễn diễn tả hành động đang diễn ra tại thời điểm nói. Chủ ngữ "I" đi cùng "am building".',
    category: 'Ngữ pháp - Hiện tại tiếp diễn'
  },
  {
    term: 'She loves learning English',
    definition: 'Cô ấy thích học tiếng Anh.',
    pos: 'sentence',
    type: 'drag_drop',
    grammarRule: 'S + love/like/enjoy + V-ing (Gerund - Danh động từ)',
    grammarExplanation: 'Sau các động từ chỉ sở thích như love, like, enjoy, ta dùng danh động từ V-ing để chỉ sở thích lâu dài.',
    category: 'Ngữ pháp - Danh động từ'
  },
  {
    term: 'He works hard every day',
    definition: 'Anh ấy làm việc chăm chỉ mỗi ngày.',
    pos: 'sentence',
    type: 'drag_drop',
    grammarRule: 'S + V(s/es) + Adv + Time (Hiện tại đơn)',
    grammarExplanation: 'Thì Hiện tại đơn diễn tả thói quen hoặc hành động lặp đi lặp lại. "He" là ngôi thứ 3 số ít nên động từ work thêm s -> works.',
    category: 'Ngữ pháp - Hiện tại đơn'
  },
  {
    term: 'The company needs to hire new employees',
    definition: 'Công ty cần tuyển dụng nhân viên mới.',
    pos: 'sentence',
    type: 'drag_drop',
    grammarRule: 'S + need + to-V (Infinitive) + Adj + Noun',
    grammarExplanation: 'Động từ "need" khi diễn tả nhu cầu làm gì đi với to-V ("to hire"). Tính từ "new" đứng trước danh từ "employees".',
    category: 'Ngữ pháp - Động từ nguyên mẫu'
  },
  {
    term: 'If it rains tomorrow, we will stay at home',
    definition: 'Nếu ngày mai trời mưa, chúng tôi sẽ ở nhà.',
    pos: 'sentence',
    type: 'drag_drop',
    grammarRule: 'If + S + V(hiện tại đơn), S + will + V (Câu điều kiện loại 1)',
    grammarExplanation: 'Câu điều kiện loại 1 diễn tả một giả định có thể xảy ra ở hiện tại hoặc tương lai.',
    category: 'Ngữ pháp - Câu điều kiện'
  },
  {
    term: 'I have lived here for five years',
    definition: 'Tôi đã sống ở đây được 5 năm.',
    pos: 'sentence',
    type: 'drag_drop',
    grammarRule: 'S + have/has + V3/V-ed + for + khoảng thời gian (Hiện tại hoàn thành)',
    grammarExplanation: 'Thì Hiện tại hoàn thành diễn tả hành động bắt đầu trong quá khứ và vẫn còn tiếp diễn ở hiện tại.',
    category: 'Ngữ pháp - Hiện tại hoàn thành'
  },
  {
    term: 'She is looking forward to meeting you',
    definition: 'Cô ấy rất mong đợi được gặp bạn.',
    pos: 'sentence',
    type: 'drag_drop',
    grammarRule: 'S + look forward to + V-ing',
    grammarExplanation: 'Cụm từ cố định "look forward to" theo sau bởi Danh động từ (V-ing), diễn tả sự mong đợi háo hức.',
    category: 'Ngữ pháp - Cụm động từ'
  },
  {
    term: 'Although it was raining, they went for a walk',
    definition: 'Mặc dù trời đang mưa, họ vẫn đi dạo.',
    pos: 'sentence',
    type: 'drag_drop',
    grammarRule: 'Although + Clause 1, Clause 2 (Liên từ nhượng bộ)',
    grammarExplanation: 'Although đứng đầu mệnh đề chỉ sự tương phản, theo sau là một mệnh đề hoàn chỉnh (S + V).',
    category: 'Ngữ pháp - Liên từ'
  },
  {
    term: 'This book is more interesting than that one',
    definition: 'Cuốn sách này thú vị hơn cuốn sách kia.',
    pos: 'sentence',
    type: 'drag_drop',
    grammarRule: 'S + be + more + Adj dài + than + Noun/Pronoun (So sánh hơn)',
    grammarExplanation: 'Với tính từ dài từ 2 âm tiết trở lên (interesting), cấu trúc so sánh hơn sử dụng "more + Adj + than".',
    category: 'Ngữ pháp - So sánh'
  },
  {
    term: 'You should drink more water every day',
    definition: 'Bạn nên uống nhiều nước hơn mỗi ngày.',
    pos: 'sentence',
    type: 'drag_drop',
    grammarRule: 'S + should + V (nguyên thể) (Động từ khuyết thiếu)',
    grammarExplanation: 'Động từ khuyết thiếu "should" dùng để đưa ra lời khuyên, động từ chính theo sau luôn ở dạng nguyên mẫu không "to".',
    category: 'Ngữ pháp - Động từ khuyết thiếu'
  }
];

/**
 * Filter suggestions by user query (English term or Vietnamese definition)
 */
export function getVocabSuggestions(query: string, limit = 6): VocabSuggestion[] {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 1) return [];

  // Match English term or Vietnamese definition
  const exactPrefixMatches: VocabSuggestion[] = [];
  const substringMatches: VocabSuggestion[] = [];

  for (const item of VOCAB_DICTIONARY) {
    const termLower = item.term.toLowerCase();
    const defLower = item.definition.toLowerCase();

    if (termLower.startsWith(clean)) {
      exactPrefixMatches.push(item);
    } else if (termLower.includes(clean) || defLower.includes(clean)) {
      substringMatches.push(item);
    }

    if (exactPrefixMatches.length + substringMatches.length >= limit * 2) {
      break;
    }
  }

  return [...exactPrefixMatches, ...substringMatches].slice(0, limit);
}
