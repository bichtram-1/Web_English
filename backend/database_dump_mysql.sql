-- ==========================================================
-- LinguaLeap DATN - Production-Grade MySQL Database Schema & Seed Data
-- High-Performance Indexed Architecture for Large-Scale Data
-- Compatible with MySQL 5.7+ / MySQL 8.0+ / MariaDB / phpMyAdmin
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `lingualeap_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lingualeap_db`;

DROP TABLE IF EXISTS `study_sessions`;
DROP TABLE IF EXISTS `user_stats`;
DROP TABLE IF EXISTS `cards`;
DROP TABLE IF EXISTS `decks`;
DROP TABLE IF EXISTS `users`;

-- --------------------------------------------------------
-- 1. Table structure for `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `passwordHash` VARCHAR(191) NOT NULL,
  `avatar` VARCHAR(500) NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'student',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table structure for `decks`
-- --------------------------------------------------------
CREATE TABLE `decks` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'Beginner',
  `color` VARCHAR(100) NOT NULL DEFAULT 'from-indigo-500 to-violet-600',
  `isPublic` BOOLEAN NOT NULL DEFAULT TRUE,
  `itemCount` INT NOT NULL DEFAULT 0,
  `creatorName` VARCHAR(191) NOT NULL DEFAULT 'LinguaTeam',
  `creatorId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_decks_category` (`category`),
  KEY `idx_decks_creatorId` (`creatorId`),
  KEY `idx_decks_isPublic` (`isPublic`),
  KEY `idx_decks_createdAt` (`createdAt`),
  CONSTRAINT `fk_decks_users` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Table structure for `cards`
-- --------------------------------------------------------
CREATE TABLE `cards` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `deckId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'flashcard',
  `front` TEXT NULL,
  `back` TEXT NULL,
  `phonetic` VARCHAR(191) NULL,
  `exampleEn` TEXT NULL,
  `exampleVi` TEXT NULL,
  `meaning` TEXT NULL,
  `shuffledJson` TEXT NULL,
  `correctOrderJson` TEXT NULL,
  `orderIndex` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_cards_deckId` (`deckId`),
  KEY `idx_cards_type` (`type`),
  KEY `idx_cards_orderIndex` (`orderIndex`),
  CONSTRAINT `fk_cards_decks` FOREIGN KEY (`deckId`) REFERENCES `decks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Table structure for `study_sessions`
-- --------------------------------------------------------
CREATE TABLE `study_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `deckId` VARCHAR(191) NOT NULL,
  `mode` VARCHAR(50) NOT NULL,
  `cardsStudied` INT NOT NULL DEFAULT 0,
  `correctCount` INT NOT NULL DEFAULT 0,
  `accuracy` DOUBLE NOT NULL DEFAULT 0.0,
  `timeSpentSeconds` INT NOT NULL DEFAULT 0,
  `xpEarned` INT NOT NULL DEFAULT 0,
  `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_sessions_userId` (`userId`),
  KEY `idx_sessions_deckId` (`deckId`),
  KEY `idx_sessions_mode` (`mode`),
  KEY `idx_sessions_completedAt` (`completedAt`),
  CONSTRAINT `fk_sessions_users` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sessions_decks` FOREIGN KEY (`deckId`) REFERENCES `decks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Table structure for `user_stats`
-- --------------------------------------------------------
CREATE TABLE `user_stats` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL UNIQUE,
  `totalCardsStudied` INT NOT NULL DEFAULT 0,
  `totalStudyTimeSeconds` INT NOT NULL DEFAULT 0,
  `totalXp` INT NOT NULL DEFAULT 0,
  `streakDays` INT NOT NULL DEFAULT 1,
  `lastStudyDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sessionsCompleted` INT NOT NULL DEFAULT 0,
  `averageAccuracy` DOUBLE NOT NULL DEFAULT 100.0,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_stats_totalXp` (`totalXp`),
  KEY `idx_stats_streakDays` (`streakDays`),
  CONSTRAINT `fk_stats_users` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- SEED DATA INSERTION
-- ==========================================================

INSERT INTO `users` (`id`, `name`, `email`, `passwordHash`, `avatar`, `role`, `createdAt`, `updatedAt`) VALUES
('user-demo-1', 'Tram Nguyen', 'student@example.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'student', NOW(), NOW()),
('user-admin-1', 'Admin Lingua', 'admin@example.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'admin', NOW(), NOW());

INSERT INTO `user_stats` (`id`, `userId`, `totalCardsStudied`, `totalStudyTimeSeconds`, `totalXp`, `streakDays`, `lastStudyDate`, `sessionsCompleted`, `averageAccuracy`, `updatedAt`) VALUES
('stat-1', 'user-demo-1', 145, 3820, 850, 5, NOW(), 12, 92.5, NOW());

INSERT INTO `decks` (`id`, `title`, `description`, `category`, `color`, `isPublic`, `itemCount`, `creatorName`, `creatorId`, `createdAt`, `updatedAt`) VALUES
('basic-comm', 'Basic Communication', 'Từ vựng tiếng Anh giao tiếp cơ bản và mẫu câu ghép từ hàng ngày cho người mới bắt đầu.', 'Beginner', 'from-violet-500 to-indigo-600', 1, 8, 'LinguaTeam', 'user-admin-1', NOW(), NOW()),
('toeic-vocab', 'TOEIC Vocabulary', 'Từ vựng trọng tâm thường gặp trong đề thi TOEIC Listening & Reading.', 'Intermediate', 'from-rose-500 to-orange-500', 1, 6, 'ExamPro', 'user-admin-1', NOW(), NOW()),
('travel-english', 'Travel English', 'Cẩm nang từ vựng giao tiếp tại sân bay, khách sạn và du lịch quốc tế.', 'Beginner', 'from-emerald-500 to-teal-600', 1, 6, 'WanderlustEdu', 'user-admin-1', NOW(), NOW()),
('ielts-writing', 'IELTS Writing Band 7+', 'Từ vựng học thuật và liên từ nối nâng cao cho bài viết IELTS Task 2.', 'Advanced', 'from-purple-600 to-pink-500', 1, 5, 'BandMaster', 'user-admin-1', NOW(), NOW());

INSERT INTO `cards` (`deckId`, `type`, `front`, `back`, `phonetic`, `exampleEn`, `exampleVi`, `orderIndex`) VALUES
('basic-comm', 'flashcard', 'Developer', 'Lập trình viên', '/dɪˈvel.ə.pər/', 'He works as a fullstack developer.', 'Anh ấy làm việc như một lập trình viên fullstack.', 1),
('basic-comm', 'flashcard', 'Beautiful', 'Xinh đẹp / Tuyệt đẹp', '/ˈbjuː.tɪ.fəl/', 'The sunset over the beach is beautiful.', 'Hoàng hôn trên bãi biển thật đẹp.', 3),
('basic-comm', 'flashcard', 'Knowledge', 'Kiến thức / Sự hiểu biết', '/ˈnɒl.ɪdʒ/', 'Knowledge is power.', 'Kiến thức là sức mạnh.', 4),
('basic-comm', 'flashcard', 'Opportunity', 'Cơ hội / Thời cơ', '/ˌɒp.əˈtʃuː.nə.ti/', NULL, NULL, 6),
('basic-comm', 'flashcard', 'Success', 'Sự thành công', '/səkˈses/', NULL, NULL, 7),
('basic-comm', 'flashcard', 'Happiness', 'Niềm hạnh phúc', '/ˈhæp.i.nəs/', NULL, NULL, 8);

INSERT INTO `cards` (`deckId`, `type`, `meaning`, `shuffledJson`, `correctOrderJson`, `orderIndex`) VALUES
('basic-comm', 'drag_drop', 'Tôi đang xây dựng một trang web.', '[{\"id\":\"w1\",\"word\":\"a\",\"type\":\"other\"},{\"id\":\"w2\",\"word\":\"building\",\"type\":\"verb\"},{\"id\":\"w3\",\"word\":\"website\",\"type\":\"noun\"},{\"id\":\"w4\",\"word\":\"I\",\"type\":\"pronoun\"},{\"id\":\"w5\",\"word\":\"am\",\"type\":\"verb\"}]', '[\"w4\",\"w5\",\"w2\",\"w1\",\"w3\"]', 2),
('basic-comm', 'drag_drop', 'Cô ấy thích học tiếng Anh.', '[{\"id\":\"x1\",\"word\":\"She\",\"type\":\"pronoun\"},{\"id\":\"x2\",\"word\":\"loves\",\"type\":\"verb\"},{\"id\":\"x3\",\"word\":\"learning\",\"type\":\"verb\"},{\"id\":\"x4\",\"word\":\"English\",\"type\":\"noun\"}]', '[\"x1\",\"x2\",\"x3\",\"x4\"]', 5);

INSERT INTO `cards` (`deckId`, `type`, `front`, `back`, `phonetic`, `orderIndex`) VALUES
('toeic-vocab', 'flashcard', 'Negotiate', 'Đàm phán / Thương lượng', '/nəˈɡəʊ.ʃi.eɪt/', 1),
('toeic-vocab', 'flashcard', 'Implement', 'Thực hiện / Thi hành kế hoạch', '/ˈɪm.plɪ.ment/', 2),
('toeic-vocab', 'flashcard', 'Revenue', 'Doanh thu', '/ˈrev.ən.juː/', 4),
('toeic-vocab', 'flashcard', 'Strategy', 'Chiến lược kinh doanh', '/ˈstræt.ə.dʒi/', 5),
('toeic-vocab', 'flashcard', 'Deadline', 'Hạn chót', '/ˈded.laɪn/', 6);

INSERT INTO `cards` (`deckId`, `type`, `meaning`, `shuffledJson`, `correctOrderJson`, `orderIndex`) VALUES
('toeic-vocab', 'drag_drop', 'Công ty cần tuyển dụng nhân viên mới.', '[{\"id\":\"t1\",\"word\":\"The\",\"type\":\"other\"},{\"id\":\"t2\",\"word\":\"company\",\"type\":\"noun\"},{\"id\":\"t3\",\"word\":\"needs\",\"type\":\"verb\"},{\"id\":\"t4\",\"word\":\"new\",\"type\":\"adjective\"},{\"id\":\"t5\",\"word\":\"to\",\"type\":\"other\"},{\"id\":\"t6\",\"word\":\"hire\",\"type\":\"verb\"},{\"id\":\"t7\",\"word\":\"employees\",\"type\":\"noun\"}]', '[\"t1\",\"t2\",\"t3\",\"t5\",\"t6\",\"t4\",\"t7\"]', 3);

INSERT INTO `study_sessions` (`id`, `userId`, `deckId`, `mode`, `cardsStudied`, `correctCount`, `accuracy`, `timeSpentSeconds`, `xpEarned`, `completedAt`) VALUES
('session-1', 'user-demo-1', 'basic-comm', 'flashcard', 8, 8, 100.0, 180, 100, NOW());
