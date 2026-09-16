import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  X,
  Volume2,
  VolumeX,
  Leaf,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Maximize2,
  Minimize2,
  HelpCircle,
  Flame,
  ArrowRight,
  Shield,
  Award,
  Eye,
  Flower2,
  Home,
  Info,
  Lock,
  Star,
  Brain,
  Compass,
  MapPin,
  Keyboard,
  Move,
  Package,
  Plus,
  Minus,
} from 'lucide-react';
import type { Deck, FlashcardItem } from '../../../types/DeckType';
import studyApi from '../../../api/studyApi';
import {
  getCardSM2Record,
  calculateSM2,
  saveSM2Record,
  getDeckSRSStats,
  getAllSM2Records,
} from '../../../utils/sm2';
import {
  DEFAULT_CHANNELS,
  ZEN_PRESETS,
  startZenEngine,
  stopZenEngine,
  applySoundChannels,
  setMasterVolume,
  applyPresetToChannels,
  playZenChime,
  playZenTapSound,
  type SoundChannel,
  type ZenPresetId,
} from '../../../utils/zenAudio';
import { cleanTtsText, stripParentheses } from '../../../hooks/useSpeech';

// --- 🐉 LIÊN QUÂN MOBILE GUARDIANS & REALMS TYPE ---
export type MythicType =
  | 'dragon'
  | 'fox'
  | 'stag'
  | 'phoenix'
  | 'dragon_koi'
  | 'celestial_lotus'
  | 'world_tree'
  | 'fairy_butterfly';

// --- BIOMES DEFINITION (8 CẢNH GIỚI CÕI THIÊN NHIÊN GẮN VỚI 8 THẦN THÚ) ---
export interface BiomeConfig {
  id: string;
  guardianType: MythicType;
  requiredWords: number;
  nameVi: string;
  nameEn: string;
  realmTitleVi: string;
  realmTitleEn: string;
  skyGradient: string;
  mountainColor: string;
  nearHillColor: string;
  waterGradient: string;
  ambientNoteVi: string;
  ambientNoteEn: string;
  accentBadgeVi: string;
  accentBadgeEn: string;
  isNight?: boolean;
  sunCorona?: string;
  cloudTint?: string;
  godRayColor?: string;
  particleType?: 'spore' | 'ember' | 'stardust' | 'sakura' | 'celestial' | 'aurora' | 'butterfly';
  grassGradientLeft?: [string, string, string, string];
  grassGradientRight?: [string, string, string, string];
  grassStroke?: string;
  waterGradientCustom?: [string, string, string, string];
}

export const BIOMES: BiomeConfig[] = [
  {
    id: 'lotus_haven',
    guardianType: 'fairy_butterfly',
    requiredWords: 0,
    nameVi: 'Hồ Sen Trăng Khuyết',
    nameEn: 'Emerald Lotus Haven',
    realmTitleVi: 'Cõi 1: Hồ Sen Trăng Khuyết',
    realmTitleEn: 'Realm 1: Emerald Lotus Haven',
    skyGradient: 'linear-gradient(180deg, #022c22 0%, #064e3b 35%, #047857 70%, #10b981 100%)',
    mountainColor: '#064e3b',
    nearHillColor: '#047857',
    waterGradient: 'linear-gradient(180deg, #059669 0%, #064e3b 100%)',
    ambientNoteVi: 'Tâm an thì vạn sự an lành, hoa sen nở rộ giữa cõi ngọc.',
    ambientNoteEn: 'When the mind is peaceful, all is well; lotuses blossom in the emerald realm.',
    accentBadgeVi: '🌿 Cõi Ngọc',
    accentBadgeEn: '🌿 Emerald Haven',
    sunCorona: '#34d399',
    cloudTint: '#ecfdf5',
    godRayColor: '#a7f3d0',
    particleType: 'butterfly',
    grassGradientLeft: ['#7bc67e', '#4caf50', '#2e7d32', '#1b5e20'],
    grassGradientRight: ['#7bc67e', '#4caf50', '#2e7d32', '#1b5e20'],
    grassStroke: '#15803d',
    waterGradientCustom: ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
  },
  {
    id: 'bamboo_sunset',
    guardianType: 'celestial_lotus',
    requiredWords: 50,
    nameVi: 'Rừng Trúc Hoàng Hôn',
    nameEn: 'Bamboo Sunset Sanctuary',
    realmTitleVi: 'Cõi 2: Rừng Trúc Hoàng Hôn',
    realmTitleEn: 'Realm 2: Bamboo Sunset Sanctuary',
    skyGradient: 'linear-gradient(180deg, #ea580c 0%, #f97316 25%, #f43f5e 55%, #a855f7 80%, #fde047 100%)',
    mountainColor: '#7c2d12',
    nearHillColor: '#9a3412',
    waterGradient: 'linear-gradient(180deg, #ea580c 0%, #7c2d12 100%)',
    ambientNoteVi: 'Cây trúc uốn mình theo gió mà chẳng hề gãy gập.',
    ambientNoteEn: 'Bamboo bends with the wind yet never breaks.',
    accentBadgeVi: '🎋 Cõi Trúc',
    accentBadgeEn: '🎋 Bamboo Realm',
    sunCorona: '#f97316',
    cloudTint: '#ffedd5',
    godRayColor: '#fed7aa',
    particleType: 'spore',
    grassGradientLeft: ['#a3e635', '#65a30d', '#4d7c0f', '#365314'],
    grassGradientRight: ['#a3e635', '#65a30d', '#4d7c0f', '#365314'],
    grassStroke: '#4d7c0f',
    waterGradientCustom: ['#fb923c', '#ea580c', '#c2410c', '#7c2d12'],
  },
  {
    id: 'dragon_koi_falls',
    guardianType: 'dragon_koi',
    requiredWords: 150,
    nameVi: 'Long Môn Vượt Thác',
    nameEn: 'Dragon Ascending Cascades',
    realmTitleVi: 'Cõi 3: Long Môn Vượt Thác',
    realmTitleEn: 'Realm 3: Dragon Ascending Cascades',
    skyGradient: 'linear-gradient(180deg, #9a3412 0%, #ea580c 25%, #f97316 55%, #fbbf24 85%, #fef08a 100%)',
    mountainColor: '#7c2d12',
    nearHillColor: '#9a3412',
    waterGradient: 'linear-gradient(180deg, #fb923c 0%, #7c2d12 100%)',
    ambientNoteVi: 'Thác nước rì rào dưới cầu trăng sơn son, thần ngư vượt thác biểu trưng cho sự kiên trì đắc đạo.',
    ambientNoteEn: 'A roaring waterfall beneath the vermilion moon bridge, sacred carp ascending toward celestial enlightenment.',
    accentBadgeVi: '🐟 Cõi Long Ngư',
    accentBadgeEn: '🐟 Dragon Koi Falls',
    sunCorona: '#f59e0b',
    cloudTint: '#fff7ed',
    godRayColor: '#fed7aa',
    particleType: 'ember',
    grassGradientLeft: ['#84cc16', '#4d7c0f', '#3f6212', '#1a2e05'],
    grassGradientRight: ['#84cc16', '#4d7c0f', '#3f6212', '#1a2e05'],
    grassStroke: '#365314',
    waterGradientCustom: ['#fdba74', '#f97316', '#c2410c', '#7c2d12'],
  },
  {
    id: 'midnight_stars',
    guardianType: 'stag',
    requiredWords: 350,
    nameVi: 'Rừng Nấm Dạ Quang Đêm Sao',
    nameEn: 'Midnight Starlight Mushroom Forest',
    realmTitleVi: 'Cõi 4: Rừng Nấm Dạ Quang Đêm Sao',
    realmTitleEn: 'Realm 4: Midnight Starlight Mushroom Forest',
    skyGradient: 'linear-gradient(180deg, #020617 0%, #0f172a 35%, #1e1b4b 70%, #312e81 100%)',
    mountainColor: '#0f172a',
    nearHillColor: '#1e1b4b',
    waterGradient: 'linear-gradient(180deg, #1e1b4b 0%, #090d16 100%)',
    ambientNoteVi: 'Rừng nấm phát sáng kỳ ảo thắp lối đầm đêm, muôn loài thú nhỏ và côn trùng dạ quang quây quần bên hươu thần ánh sao.',
    ambientNoteEn: 'A magical glowing mushroom forest illuminating the midnight lagoon, where small woodland creatures and fireflies gather around the starlight stag.',
    accentBadgeVi: '🍄 Cõi Nấm Sao',
    accentBadgeEn: '🍄 Star Mushroom Realm',
    isNight: true,
    sunCorona: '#818cf8',
    cloudTint: '#1e1b4b',
    godRayColor: '#a5b4fc',
    particleType: 'stardust',
    grassGradientLeft: ['#4338ca', '#312e81', '#1e1b4b', '#0f172a'],
    grassGradientRight: ['#4338ca', '#312e81', '#1e1b4b', '#0f172a'],
    grassStroke: '#6366f1',
    waterGradientCustom: ['#6366f1', '#4338ca', '#312e81', '#0f172a'],
  },
  {
    id: 'glacial_phoenix_crest',
    guardianType: 'phoenix',
    requiredWords: 750,
    nameVi: 'Xứ Sở Tuyết Trắng Mùa Đông',
    nameEn: 'Glacial Winter Wonderland',
    realmTitleVi: 'Cõi 5: Xứ Sở Tuyết Trắng Mùa Đông',
    realmTitleEn: 'Realm 5: Glacial Winter Wonderland',
    skyGradient: 'linear-gradient(180deg, #082f49 0%, #0369a1 30%, #0284c7 60%, #38bdf8 85%, #bae6fd 100%)',
    mountainColor: '#0c4a6e',
    nearHillColor: '#0284c7',
    waterGradient: 'linear-gradient(180deg, #38bdf8 0%, #082f49 100%)',
    ambientNoteVi: 'Tuyết trắng phủ kín ngôi nhà ấm cúng và chú người tuyết dễ thương, dải cực quang soi bóng hồ băng bên băng phượng hoàng.',
    ambientNoteEn: 'Pure snow blankets the cozy cabin and cheerful snowman, while auroras dance over frozen waters beside the glacial phoenix.',
    accentBadgeVi: '❄️ Xứ Sở Tuyết',
    accentBadgeEn: '❄️ Winter Wonderland',
    sunCorona: '#67e8f9',
    cloudTint: '#f0f9ff',
    godRayColor: '#bae6fd',
    particleType: 'aurora',
    grassGradientLeft: ['#ffffff', '#f1f5f9', '#e2e8f0', '#cbd5e1'],
    grassGradientRight: ['#ffffff', '#f1f5f9', '#e2e8f0', '#cbd5e1'],
    grassStroke: '#94a3b8',
    waterGradientCustom: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#0284c7'],
  },
  {
    id: 'sakura_valley',
    guardianType: 'fox',
    requiredWords: 1350,
    nameVi: 'Thung Lũng Anh Đào Sương Mai',
    nameEn: 'Cherry Blossom Valley',
    realmTitleVi: 'Cõi 6: Thung Lũng Anh Đào Sương Mai',
    realmTitleEn: 'Realm 6: Cherry Blossom Valley',
    skyGradient: 'linear-gradient(180deg, #831843 0%, #be185d 25%, #f43f5e 55%, #fbcfe8 85%, #fff1f2 100%)',
    mountainColor: '#831843',
    nearHillColor: '#be185d',
    waterGradient: 'linear-gradient(180deg, #fb7185 0%, #831843 100%)',
    ambientNoteVi: 'Hoa nở đúng thời, cánh đào lất phất thơm ngát đọng lại tri thức cùng cửu vĩ linh hồ.',
    ambientNoteEn: 'Blossoms arrive in their own time, fragrant petals drifting with timeless wisdom beside the nine-tailed fox.',
    accentBadgeVi: '🌸 Cõi Hoa',
    accentBadgeEn: '🌸 Blossom Valley',
    sunCorona: '#f472b6',
    cloudTint: '#fff1f2',
    godRayColor: '#fce7f3',
    particleType: 'sakura',
    grassGradientLeft: ['#fbcfe8', '#86efac', '#22c55e', '#15803d'],
    grassGradientRight: ['#fbcfe8', '#86efac', '#22c55e', '#15803d'],
    grassStroke: '#ec4899',
    waterGradientCustom: ['#f472b6', '#fb7185', '#e11d48', '#831843'],
  },
  {
    id: 'celestial_peaks',
    guardianType: 'dragon',
    requiredWords: 2100,
    nameVi: 'Bãi Biển Thiên Đường & Đảo San Hô',
    nameEn: 'Azure Coral Coast & Sandy Beach',
    realmTitleVi: 'Cõi 7: Bãi Biển Thiên Đường & Đảo San Hô',
    realmTitleEn: 'Realm 7: Azure Coral Coast & Sandy Beach',
    skyGradient: 'linear-gradient(180deg, #0284c7 0%, #38bdf8 30%, #7dd3fc 60%, #fed7aa 85%, #ffedd5 100%)',
    mountainColor: '#0369a1',
    nearHillColor: '#0284c7',
    waterGradient: 'linear-gradient(180deg, #06b6d4 0%, #0369a1 100%)',
    ambientNoteVi: 'Hàng dừa nghiêng bóng trên bãi cát vàng óng ả, sóng biển vỗ về rạn san hô xanh biếc dưới bóng thần long hải vương.',
    ambientNoteEn: 'Palm trees sway above sun-warmed golden sands, gentle waves caressing vibrant coral reefs beneath the celestial sea dragon.',
    accentBadgeVi: '🌴 Cõi Biển Xanh',
    accentBadgeEn: '🌴 Azure Coast',
    sunCorona: '#f59e0b',
    cloudTint: '#ffffff',
    godRayColor: '#fef08a',
    particleType: 'celestial',
    grassGradientLeft: ['#fef08a', '#fde047', '#f59e0b', '#d97706'],
    grassGradientRight: ['#fef08a', '#fde047', '#f59e0b', '#d97706'],
    grassStroke: '#b45309',
    waterGradientCustom: ['#67e8f9', '#22d3ee', '#06b6d4', '#0284c7'],
  },
  {
    id: 'cosmic_world_tree',
    guardianType: 'world_tree',
    requiredWords: 3000,
    nameVi: 'Khởi Nguyên Thần Mộc',
    nameEn: 'Cosmic Tree of Origin',
    realmTitleVi: 'Cõi 8: Khởi Nguyên Thần Mộc',
    realmTitleEn: 'Realm 8: Eternal World Tree',
    skyGradient: 'linear-gradient(180deg, #042f2e 0%, #115e59 25%, #0d9488 55%, #2dd4bf 80%, #ccfbf1 100%)',
    mountainColor: '#042f2e',
    nearHillColor: '#115e59',
    waterGradient: 'linear-gradient(180deg, #2dd4bf 0%, #042f2e 100%)',
    ambientNoteVi: 'Đại thụ ngàn năm che chở cội nguồn tri thức, các hạt linh bào vũ trụ nuôi dưỡng cảnh giới tối thượng.',
    ambientNoteEn: 'The primordial world tree cradles the wellspring of wisdom, cosmic spores illuminating the supreme realm.',
    accentBadgeVi: '🌳 Thần Mộc Cõi',
    accentBadgeEn: '🌳 World Tree Sanctuary',
    sunCorona: '#2dd4bf',
    cloudTint: '#f0fdfa',
    godRayColor: '#99f6e4',
    particleType: 'spore',
    grassGradientLeft: ['#5eead4', '#14b8a6', '#0f766e', '#042f2e'],
    grassGradientRight: ['#5eead4', '#14b8a6', '#0f766e', '#042f2e'],
    grassStroke: '#2dd4bf',
    waterGradientCustom: ['#2dd4bf', '#0d9488', '#115e59', '#042f2e'],
  },
];

// --- 🌸 LIVING GARDEN ELEMENTS (CÂY, HOA, NHÀ, ĐÈN, CÁ KOI, BƯỚM NỞ RỘ) ---
export type GardenItemType =
  | 'sakura_flower'
  | 'water_lotus'
  | 'chrysanthemum'
  | 'bamboo_sprout'
  | 'bonsai_tree'
  | 'tea_house'
  | 'stone_lantern'
  | 'koi_fish'
  | 'butterflies'
  | 'fireflies'
  | 'bamboo_fountain'
  | 'flower_bed'
  | 'wooden_boat'
  | 'chinese_rose'
  | 'tea_ceremony'
  | 'cherry_tree'
  | 'tall_bamboo'
  | 'wild_flower_bed'
  | 'imperial_pagoda';

export interface GardenCatalogInfo {
  type: GardenItemType;
  labelVi: string;
  labelEn: string;
  icon: string;
  image: string;
  category: 'flora' | 'architecture' | 'fauna';
  descVi: string;
  descEn: string;
}

export const GARDEN_CATALOG: Record<GardenItemType, GardenCatalogInfo> = {
  sakura_flower: {
    type: 'sakura_flower',
    labelVi: 'Hoa Anh Đào Bồng Lai',
    labelEn: 'Celestial Sakura Bonsai',
    icon: '🌸',
    image: '/images/zen/elements/sakura_bonsai_tree.png?v=20260908b',
    category: 'flora',
    descVi: 'Cây hoa anh đào bồng lai cổ thụ ngàn năm nở rộ muôn vàn cánh hoa hồng phấn tỏa ánh linh quang, ngự trong chậu gốm rồng uy nghi.',
    descEn: 'A magnificent thousand-year celestial sakura bonsai blooming with radiant pink petals in an ornate imperial dragon pot.',
  },
  water_lotus: {
    type: 'water_lotus',
    labelVi: 'Hoa Súng Hồng & Lá Sen Nổi',
    labelEn: 'Pink Water Lilies & Floating Pads',
    icon: '🪷',
    image: '/images/zen/elements/lotus.png?v=20260908b',
    category: 'flora',
    descVi: 'Những đóa hoa súng hồng ngọc nở rộ trên phiến lá sen tròn xanh biếc, bồng bềnh êm ả trôi theo dòng nước trong vắt.',
    descEn: 'Radiant pink water lilies nestled on emerald floating pads drifting peacefully across the clear stream.',
  },
  chrysanthemum: {
    type: 'chrysanthemum',
    labelVi: 'Hoa Cúc Vàng Dạ Thảo',
    labelEn: 'Golden Chrysanthemum',
    icon: '🌼',
    image: '/images/zen/elements/chrysanthemum.png?v=20260908b',
    category: 'flora',
    descVi: 'Đóa cúc vàng nở rộ đón ánh ban mai, nhụy hoa tỏa phấn thơm thanh dịu đung đưa nhẹ nhàng.',
    descEn: 'Golden petals open to greet the dawn, swaying peacefully with soothing fragrance.',
  },
  bamboo_sprout: {
    type: 'bamboo_sprout',
    labelVi: 'Khóm Trúc Ngọc Cổ Kính',
    labelEn: 'Sacred Jade Bamboo Grove',
    icon: '🌿',
    image: '/images/zen/elements/zen_bamboo.png?v=20260908b',
    category: 'flora',
    descVi: 'Khóm trúc xanh biếc chạm hoa văn mây cổ điển vươn cao tràn đầy sinh khí, có lồng đèn nhỏ thắp sáng ban mai.',
    descEn: 'Graceful emerald bamboo stalks with traditional cloud motifs and a delicate hanging lantern.',
  },
  bonsai_tree: {
    type: 'bonsai_tree',
    labelVi: 'Cây Tùng Bonsai Cổ Thụ',
    labelEn: 'Ancient Bonsai Pine',
    icon: '🌳',
    image: '/images/zen/elements/bonsai.png?v=20260908b',
    category: 'flora',
    descVi: 'Thân gỗ cổ thụ uốn lượn phong trần, tán lá tầng tầng lớp lớp xanh mướt vững chãi ngàn năm.',
    descEn: 'Gnarled timber trunk shaped by centuries of mountain winds, crowned by tiered evergreen foliage.',
  },
  tea_house: {
    type: 'tea_house',
    labelVi: 'Vọng Lâu Thủy Tạ Á Đông',
    labelEn: 'Oriental Waterside Tea Pavilion',
    icon: '🏡',
    image: '/images/zen/elements/zen_teahouse.png?v=20260908b',
    category: 'architecture',
    descVi: 'Vọng lâu thủy tạ ngói ngọc lam uốn lượn cổ kính, các dãy đèn lồng ấm áp soi bóng xuống mặt hồ nước biếc.',
    descEn: 'A grand waterside tea pavilion with turquoise glazed roofs and glowing lanterns reflecting over the tranquil river.',
  },
  stone_lantern: {
    type: 'stone_lantern',
    labelVi: 'Đèn Đá Kasuga Cổ Kính',
    labelEn: 'Ancient Kasuga Stone Lantern',
    icon: '🏮',
    image: '/images/zen/elements/zen_lantern.png?v=20260908b',
    category: 'architecture',
    descVi: 'Trụ đèn đá Kasuga phong cách Thiền tông phủ rêu phong, ngọn đèn ấm áp dẫn lối bên bờ nước.',
    descEn: 'A moss-covered Japanese Kasuga stone lantern shedding a warm golden sanctuary light beside the water.',
  },
  koi_fish: {
    type: 'koi_fish',
    labelVi: 'Đàn Cá Koi Ngũ Sắc',
    labelEn: 'Swimming Five-Color Koi',
    icon: '🐟',
    image: '/images/zen/elements/koi.png?v=20260908b',
    category: 'fauna',
    descVi: 'Đàn cá bơi lội thanh thoát trong hồ nước thiêng, quẫy đuôi tạo nên những gợn sóng an lành.',
    descEn: 'Graceful koi gliding across the clear pool, fanning diaphanous fins that create peaceful ripples.',
  },
  butterflies: {
    type: 'butterflies',
    labelVi: 'Đôi Bướm Tiên Dập Dìu',
    labelEn: 'Fluttering Fairy Butterflies',
    icon: '🦋',
    image: '/images/zen/elements/butterflies.png?v=20260908b',
    category: 'fauna',
    descVi: 'Đôi bướm đa sắc chao liệng vờn quanh các khóm hoa, mang lại sự sinh động và tươi mới cho khu vườn.',
    descEn: 'A pair of iridescent butterflies dancing around garden blossoms, bringing playful joy to the sanctuary.',
  },
  fireflies: {
    type: 'fireflies',
    labelVi: 'Đom Đóm Dạ Quang Phát Sáng',
    labelEn: 'Bioluminescent Fireflies',
    icon: '✨',
    image: '/images/zen/elements/butterflies.png?v=20260908b',
    category: 'fauna',
    descVi: 'Những đốm sáng dạ quang lập lòe bay lượn từ mặt hồ trong làn sương đêm tĩnh lặng.',
    descEn: 'Glowing orbs of gentle emerald light floating above misty twilight waters.',
  },
  bamboo_fountain: {
    type: 'bamboo_fountain',
    labelVi: 'Thác Nước Trúc Shishi-odoshi',
    labelEn: 'Zen Bamboo Water Fountain',
    icon: '🎋',
    image: '/images/zen/elements/zen_fountain.png?v=20260908b',
    category: 'architecture',
    descVi: 'Máng trúc gõ đá róc rách tuần hoàn, dẫn dòng nước nguồn tinh khiết thanh lọc tâm hồn.',
    descEn: 'A traditional shishi-odoshi bamboo fountain with flowing crystal water purifying the garden.',
  },
  flower_bed: {
    type: 'flower_bed',
    labelVi: 'Bồn Hoa Cẩm Tú Cầu',
    labelEn: 'Hydrangea Planter Box',
    icon: '💐',
    image: '/images/zen/elements/zen_flower_bed.png?v=20260908b',
    category: 'flora',
    descVi: 'Bồn gỗ mộc chạm khắc tinh xảo đầy ắp những chùm cẩm tú cầu tím biếc và hồng thắm mọng sương sớm.',
    descEn: 'A rustic hand-carved wooden planter overflowing with morning-dew hydrangeas in rich violet and rose pink.',
  },
  wooden_boat: {
    type: 'wooden_boat',
    labelVi: 'Thuyền Gỗ Cổ Bồng Bềnh',
    labelEn: 'Classical Brown Wooden Sampan',
    icon: '🚣',
    image: '/images/zen/elements/boat.png?v=20260915_wood',
    category: 'architecture',
    descVi: 'Chiếc thuyền gỗ nâu cổ điển mang tông màu đồng điệu với vọng lâu thủy tạ, nhẹ trôi êm đềm theo sóng nước thiền tĩnh lặng.',
    descEn: 'An authentic classical brown wooden sampan boat harmonizing with the waterside tea pavilion, gently drifting on the serene river.',
  },
  chinese_rose: {
    type: 'chinese_rose',
    labelVi: 'Bụi Hồng Cổ Trang Nhỏ Xinh',
    labelEn: 'Miniature Classical Chinese Rose',
    icon: '🌹',
    image: '/images/zen/elements/chinese_rose.png?v=20260915_rose',
    category: 'flora',
    descVi: 'Bụi hoa hồng cổ trang dáng nhỏ xinh xắn nở rộ trên tảng đá phong rêu đượm nét thanh tao, sắc hoa đỏ thắm tôn thêm vẻ hoài cổ của cõi ngọc.',
    descEn: 'A charming miniature antique Chinese rose bush blossoming gracefully atop mossy stones with classical elegance.',
  },
  tea_ceremony: {
    type: 'tea_ceremony',
    labelVi: 'Bụi Hồng Cổ Trang Nhỏ Xinh',
    labelEn: 'Miniature Classical Chinese Rose',
    icon: '🌹',
    image: '/images/zen/elements/chinese_rose.png?v=20260915_rose',
    category: 'flora',
    descVi: 'Bụi hoa hồng cổ trang dáng nhỏ xinh xắn nở rộ trên tảng đá phong rêu đượm nét thanh tao, sắc hoa đỏ thắm tôn thêm vẻ hoài cổ của cõi ngọc.',
    descEn: 'A charming miniature antique Chinese rose bush blossoming gracefully atop mossy stones with classical elegance.',
  },
  cherry_tree: {
    type: 'cherry_tree',
    labelVi: 'Đại Thụ Anh Đào Mọc Tự Nhiên',
    labelEn: 'Grand Blooming Sakura Tree',
    icon: '🌸',
    image: '/images/zen/elements/cherry_tree.png?v=20260915_tree',
    category: 'flora',
    descVi: 'Cây anh đào đại thụ mọc tự nhiên trên thảm cỏ, rễ bám sâu vào lòng đất rêu phong, tán hoa hồng rực rỡ kết thành dàn đào ngút ngàn.',
    descEn: 'An ancient sakura tree rooted deeply into mossy soil, blossoming with vibrant pink flowers to form a scenic grove.',
  },
  tall_bamboo: {
    type: 'tall_bamboo',
    labelVi: 'Rừng Trúc Xanh Bạt Ngàn',
    labelEn: 'Towering Emerald Bamboo Grove',
    icon: '🎍',
    image: '/images/zen/elements/bamboo.png?v=20260908b',
    category: 'flora',
    descVi: 'Rừng trúc xanh cao vút đón gió ngàn, thân trúc dẻo dai kiên cường mang lại sinh khí dồi dào và thanh tịnh cho ốc đảo.',
    descEn: 'Towering jade bamboo stalks reaching skyward, swaying rhythmically with mountain winds.',
  },
  wild_flower_bed: {
    type: 'wild_flower_bed',
    labelVi: 'Thảm Hoa Rừng Bờ Nước',
    labelEn: 'Wildflower Riverbank Meadow',
    icon: '🌺',
    image: '/images/zen/elements/flower_bed.png?v=20260908b',
    category: 'flora',
    descVi: 'Thảm hoa rừng đầy hương sắc bừng nở bên bờ cỏ Tây, điểm tô sắc màu rực rỡ cho khu vườn thiền bên dòng suối biếc.',
    descEn: 'A vibrant riverside wildflower meadow bursting with colorful blooms and refreshing fragrance.',
  },
  imperial_pagoda: {
    type: 'imperial_pagoda',
    labelVi: 'Thủy Tạ Lầu Son Cung Đình',
    labelEn: 'Imperial Waterside Pavilion',
    icon: '🏯',
    image: '/images/zen/elements/teahouse.png?v=20260908b',
    category: 'architecture',
    descVi: 'Tháp lầu son gác tía uy nghi tráng lệ soi bóng xuống mặt hồ nước biếc trong buổi hoàng hôn thanh bình.',
    descEn: 'A majestic imperial lakeside pavilion with tiered roofs and serene wooden architecture overlooking the river.',
  },
};

export interface GardenEntityVariant {
  flipX?: boolean;
  hueRotate?: number;
  brightness?: number;
  saturate?: number;
  scaleMultiplier?: number;
  rotationJitter?: number;
  colorNameVi?: string;
  colorNameEn?: string;
}

export interface GardenEntity {
  id: string;
  type: GardenItemType;
  x: number;
  y: number;
  scale: number;
  labelVi: string;
  labelEn: string;
  descVi: string;
  descEn: string;
  createdAt: number;
  variant?: GardenEntityVariant;
  customPos?: boolean;
}

// --- 🐉 LIÊN QUÂN MOBILE GUARDIANS (COMPANION & CODEX) ---
export interface MythicAssetInfo {
  type: MythicType;
  image: string;
  imageHd: string;
  labelVi: string;
  labelEn: string;
  titleVi: string;
  titleEn: string;
  tier: string;
  tierColor: string;
  elementVi: string;
  elementEn: string;
  descVi: string;
  descEn: string;
  glowColor: string;
}

export const MYTHIC_ASSETS: Record<MythicType, MythicAssetInfo> = {
  dragon: {
    type: 'dragon',
    image: '/images/zen/dragon_sm.jpg',
    imageHd: '/images/zen/dragon.jpg',
    labelVi: 'Thần Long Hoàng Kim',
    labelEn: 'Golden Celestial Dragon',
    titleVi: 'Thái Cực Thần Long',
    titleEn: 'Taiji Sovereign Dragon',
    tier: 'BẬC SSS',
    tierColor: 'from-amber-400 to-yellow-600',
    elementVi: 'Lôi Hỏa & Hoàng Kim Quang',
    elementEn: 'Thunder Fire & Golden Radiance',
    descVi: 'Chúa tể cửu thiên với thân rồng dát vàng rực rỡ, bờm lửa hoàng kim và sừng tinh thể hổ phách ngự trên mây lành.',
    descEn: 'Sovereign of the nine skies with gilded scales, golden mane, and amber crystal horns riding sacred clouds.',
    glowColor: '#facc15',
  },
  fox: {
    type: 'fox',
    image: '/images/zen/fox_sm.jpg',
    imageHd: '/images/zen/fox.jpg',
    labelVi: 'Cửu Vĩ Linh Hồ',
    labelEn: 'Nine-Tailed Mystic Fox',
    titleVi: 'Huyễn Vực Tiên Hồ',
    titleEn: 'Illusion Realm Spirit Fox',
    tier: 'BẬC SSS',
    tierColor: 'from-pink-400 to-purple-600',
    elementVi: 'Huyễn Ảo & Anh Đào',
    elementEn: 'Illusion & Cherry Blossom',
    descVi: 'Hồ ly 9 đuôi lụa mềm mại vẫy trong gió, mắt lam ngọc huyền ảo mang lại linh khí và may mắn cho người tu học.',
    descEn: 'Nine silky tails swaying in the wind with sapphire eyes, bestowing celestial fortune upon the diligent learner.',
    glowColor: '#ec4899',
  },
  stag: {
    type: 'stag',
    image: '/images/zen/stag_sm.jpg',
    imageHd: '/images/zen/stag.jpg',
    labelVi: 'Linh Hươu Ánh Trăng',
    labelEn: 'Moonlight Sacred Stag',
    titleVi: 'Nguyệt Quang Thần Lộc',
    titleEn: 'Lunar Divine Deer',
    tier: 'BẬC SS',
    tierColor: 'from-cyan-300 to-blue-600',
    elementVi: 'Băng Tinh & Nguyệt Quang',
    elementEn: 'Frost Crystal & Moonlight',
    descVi: 'Bộ gạc hươu kết tinh từ pha lê và tinh tú vũ trụ nở hoa dạ quang, mỗi bước chân thắp sáng màn đêm.',
    descEn: 'Antlers crystalized from starlight blossoming with nocturnal flowers, illuminating the tranquil night.',
    glowColor: '#38bdf8',
  },
  phoenix: {
    type: 'phoenix',
    image: '/images/zen/phoenix_sm.jpg',
    imageHd: '/images/zen/phoenix.jpg',
    labelVi: 'Khổng Tước Thần Quang',
    labelEn: 'Prismatic Solar Phoenix',
    titleVi: 'Băng Vũ Thiên Hoàng',
    titleEn: 'Glacial Feather Sovereign',
    tier: 'BẬC SSS',
    tierColor: 'from-sky-400 to-indigo-600',
    elementVi: 'Băng Tuyết & Tinh Vân',
    elementEn: 'Glacial Frost & Nebula',
    descVi: 'Đôi cánh băng lam vĩ đại rực sáng giữa ngân hà, lông đuôi công lấp lánh ngọc bảo đa sắc xua tan mệt mỏi.',
    descEn: 'Magnificent azure wings illuminating the cosmos, shedding worries with celestial plumage.',
    glowColor: '#22d3ee',
  },
  dragon_koi: {
    type: 'dragon_koi',
    image: '/images/zen/dragon_koi_sm.jpg',
    imageHd: '/images/zen/dragon_koi.jpg',
    labelVi: 'Kỳ Ngư Long Quy',
    labelEn: 'Dragon Ascending Koi',
    titleVi: 'Cửu Khúc Thần Ngư',
    titleEn: 'Nine-Stream Divine Fish',
    tier: 'BẬC SS',
    tierColor: 'from-emerald-400 to-teal-600',
    elementVi: 'Linh Thủy & Thần Khí',
    elementEn: 'Sacred Water & Vital Qi',
    descVi: 'Thần ngư hóa rồng với vây lụa phát quang bơi lội trong hồ nước linh thiêng, biểu trưng cho sự bền bỉ đắc đạo.',
    descEn: 'Sacred carp ascending to a celestial dragon, swimming in crystal waters as a symbol of steadfast mastery.',
    glowColor: '#2dd4bf',
  },
  celestial_lotus: {
    type: 'celestial_lotus',
    image: '/images/zen/celestial_lotus_sm.jpg',
    imageHd: '/images/zen/celestial_lotus.jpg',
    labelVi: 'Thần Hoa Sen Thái Cực',
    labelEn: 'Taiji Primordial Lotus',
    titleVi: 'Vạn Niên Kim Liên',
    titleEn: 'Eternal Golden Lotus',
    tier: 'BẬC S+',
    tierColor: 'from-rose-400 to-pink-600',
    elementVi: 'Thái Cực & Sinh Mệnh',
    elementEn: 'Taiji & Life Force',
    descVi: 'Đóa sen nghìn cánh nở rộ phát ra các hạt linh khí và biểu tượng âm dương, thanh lọc trí não và dưỡng tâm.',
    descEn: 'A thousand-petaled lotus radiating pure cosmic qi and yin-yang harmony to purify and calm the mind.',
    glowColor: '#f43f5e',
  },
  world_tree: {
    type: 'world_tree',
    image: '/images/zen/world_tree_sm.jpg',
    imageHd: '/images/zen/world_tree.jpg',
    labelVi: 'Thần Mộc Khởi Nguyên',
    labelEn: 'Cosmic Tree of Origin',
    titleVi: 'Vũ Trụ Thế Giới Thụ',
    titleEn: 'Universal World Pillar',
    tier: 'BẬC THẦN THOẠI',
    tierColor: 'from-teal-300 to-emerald-600',
    elementVi: 'Vũ Trụ & Sinh Khí',
    elementEn: 'Cosmic Energy & Ancient Wood',
    descVi: 'Đại thụ ngàn năm cành lá đan xen tinh vân phát sáng rực rỡ, rễ thần neo giữ cội nguồn tri thức nhân loại.',
    descEn: 'An ancient tree interwoven with luminous nebulae, anchoring the eternal wellspring of knowledge.',
    glowColor: '#34d399',
  },
  fairy_butterfly: {
    type: 'fairy_butterfly',
    image: '/images/zen/fairy_butterfly_sm.jpg',
    imageHd: '/images/zen/fairy_butterfly.jpg',
    labelVi: 'Huyễn Điệp Tinh Vân',
    labelEn: 'Nebula Dream Butterfly',
    titleVi: 'Ngân Hà Tinh Điệp',
    titleEn: 'Galactic Prismatic Wings',
    tier: 'BẬC S+',
    tierColor: 'from-violet-400 to-fuchsia-600',
    elementVi: 'Tinh Vân & Ảo Ảnh',
    elementEn: 'Nebula & Dream Mirage',
    descVi: 'Cánh bướm kết tinh từ bụi sao vũ trụ, chao liệng mang theo những luồng ánh sáng diệu kỳ khai thông trí tuệ.',
    descEn: 'Wings spun from cosmic stardust, tracing radiant trails of inspiration to awaken inner wisdom.',
    glowColor: '#c084fc',
  },
};

export const GUARDIAN_UNLOCK_MILESTONES: Record<MythicType, number> = {
  fairy_butterfly: 0,    // BẬC S+ (Khởi đầu - Huyễn Điệp Tinh Vân: 0 từ)
  celestial_lotus: 50,   // BẬC S+ (50 từ - Thần Hoa Sen Thái Cực)
  dragon_koi: 150,       // BẬC SS (150 từ - Kỳ Ngư Long Quy)
  stag: 350,             // BẬC SS (350 từ - Linh Hươu Ánh Trăng)
  phoenix: 750,          // BẬC SSS (750 từ - Khổng Tước Thần Quang)
  fox: 1350,             // BẬC SSS (1.350 từ - Cửu Vĩ Linh Hồ)
  dragon: 2100,          // BẬC SSS (2.100 từ - Thần Long Hoàng Kim)
  world_tree: 3000,      // BẬC THẦN THOẠI (3.000 từ - Thần Mộc Khởi Nguyên)
};

export const MYTHIC_POOL: MythicType[] = [
  'fairy_butterfly',
  'celestial_lotus',
  'dragon_koi',
  'stag',
  'phoenix',
  'fox',
  'dragon',
  'world_tree',
];

// --- 🌟 HỆ THỐNG ĐỘT PHÁ SAO LINH THÚ (1⭐ ➔ 5⭐: 3.000 ➔ 5.000 TỪ VỰNG) ---
export interface StarTierConfig {
  stars: number;
  nameVi: string;
  nameEn: string;
  titleVi: string;
  titleEn: string;
  requiredWords: number; // Tổng số từ tích lũy để đột phá sao này
  auraColor: string;
  bonusDescVi: string;
  bonusDescEn: string;
}

export const GUARDIAN_STAR_TIERS: StarTierConfig[] = [
  {
    stars: 1,
    nameVi: 'Thức Tỉnh Sơ Giai',
    nameEn: 'Awakened Realm',
    titleVi: 'Sơ Khai Thần Thể',
    titleEn: 'Primordial Form',
    requiredWords: 0,
    auraColor: '#facc15',
    bonusDescVi: 'Linh thú thức tỉnh gia hộ bước đầu tu học.',
    bonusDescEn: 'Guardian awakens to bless your initial journey.',
  },
  {
    stars: 2,
    nameVi: 'Tinh Vân Chi Hào',
    nameEn: 'Nebula Shimmer',
    titleVi: 'Tinh Vân Hộ Thể',
    titleEn: 'Nebula Body',
    requiredWords: 3500,
    auraColor: '#38bdf8',
    bonusDescVi: 'Bụi sao vũ trụ bao bọc, tỏa ánh lam tinh tế.',
    bonusDescEn: 'Enveloped in cosmic stardust radiating azure light.',
  },
  {
    stars: 3,
    nameVi: 'Ngân Hà Thần Dực',
    nameEn: 'Galactic Radiance',
    titleVi: 'Ngân Hà Chấn Thế',
    titleEn: 'Galactic Force',
    requiredWords: 4000,
    auraColor: '#ec4899',
    bonusDescVi: 'Hào quang ngân hà sáng rực rỡ, tâm trí minh mẫn phi phàm.',
    bonusDescEn: 'Galactic aura doubled in brilliance, sharpening inner focus.',
  },
  {
    stars: 4,
    nameVi: 'Thái Cực Thần Thể',
    nameEn: 'Taiji Astral',
    titleVi: 'Thái Cực Quy Tông',
    titleEn: 'Taiji Harmony',
    requiredWords: 4500,
    auraColor: '#a855f7',
    bonusDescVi: 'Âm dương dung hợp, khai thông toàn diện trực giác ngôn ngữ.',
    bonusDescEn: 'Yin-yang synthesis, fully unlocking linguistic intuition.',
  },
  {
    stars: 5,
    nameVi: 'Cửu Thiên Chí Tôn',
    nameEn: 'Celestial Sovereign',
    titleVi: 'Cửu Thiên Đắc Đạo (5.000 Từ)',
    titleEn: 'Celestial Ascension (5,000 Words)',
    requiredWords: 5000,
    auraColor: '#f59e0b',
    bonusDescVi: 'Cảnh giới 5.000 từ tối thượng: Dát vàng hoàng kim, làm chủ tiếng Anh!',
    bonusDescEn: 'The 5,000 words pinnacle: Gilded celestial glory, ultimate English fluency!',
  },
];

// --- 🎨 ITEM SPRITE RENDER CONFIGURATION (HIGH-ART ORIENTAL PAINTING SPRITES) ---
interface ItemRenderConfig {
  img: string;
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
  shadowRx: number;
  shadowRy: number;
  shadowY: number;
  dropShadow: string;
  animate?: any;
  animDuration?: number;
}

export interface RealmAssetOverride {
  img: string;
  width?: number;
  height?: number;
  xOffset?: number;
  yOffset?: number;
  shadowRx?: number;
  shadowRy?: number;
  labelVi?: string;
  labelEn?: string;
  descVi?: string;
  descEn?: string;
  icon?: string;
}

export const REALM_ITEM_OVERRIDES: Record<string, Partial<Record<GardenItemType, RealmAssetOverride>>> = {
  bamboo_sunset: {
    bamboo_fountain: {
      img: '/images/zen/elements/bamboo_waterwheel.png?v=20260915_wheel',
      width: 145,
      height: 140,
      xOffset: -72.5,
      yOffset: -125,
      shadowRx: 60,
      shadowRy: 16,
      labelVi: 'Guồng Nước Gỗ Trúc Cổ Ven Suối',
      labelEn: 'Antique Bamboo Waterwheel',
      descVi: 'Guồng nước gỗ trúc cổ kính tuần hoàn quay chậm rãi múc nước suối hoàng hôn, mang vẻ đẹp bình dị hoài cổ của sơn thôn ẩn dật.',
      descEn: 'An authentic antique bamboo and timber waterwheel turning rhythmically by the sunset stream, exuding rustic mountain seclusion.',
      icon: '🎡',
    },
    tea_house: {
      img: '/images/zen/elements/bamboo_hut.png?v=20260915_hut',
      width: 180,
      height: 172,
      xOffset: -90,
      yOffset: -142,
      shadowRx: 72,
      shadowRy: 20,
      labelVi: 'Chòi Trà Mái Tranh & Bàn Cờ Đàn Tranh',
      labelEn: 'Hermit Thatched Tea Hut & Guqin',
      descVi: 'Chòi gỗ mộc mái lá tranh thanh bần dưới bóng trúc, bên trong đặt bàn cờ vây bằng đá, đàn tranh cổ và ấm trà tử sa ngắm ráng chiều hoàng hôn.',
      descEn: 'A rustic hermit thatched tea pavilion sheltered by bamboo, furnished with a stone Go chessboard, antique Guqin zither, and clay teapot.',
      icon: '🛖',
    },
    stone_lantern: {
      img: '/images/zen/elements/bamboo_red_lantern.png?v=20260915_lantern',
      width: 82,
      height: 110,
      xOffset: -41,
      yOffset: -98,
      shadowRx: 26,
      shadowRy: 9,
      labelVi: 'Lồng Đèn Lụa Đỏ Treo Nhánh Trúc',
      labelEn: 'Crimson Silk Bamboo Lantern',
      descVi: 'Lồng đèn lụa đỏ thắm thêu chữ cát tường treo hờ hững trên cành trúc uốn lượn, tỏa ánh sáng vàng ấm áp soi rọi thềm cỏ hoàng hôn.',
      descEn: 'A traditional crimson silk tassel lantern suspended gracefully from a bowed bamboo stalk, casting a warm amber glow upon the sunset grass.',
      icon: '🏮',
    },
    wooden_boat: {
      img: '/images/zen/elements/bamboo_raft.png?v=20260915_raft',
      width: 148,
      height: 106,
      xOffset: -74,
      yOffset: -53,
      shadowRx: 68,
      shadowRy: 18,
      labelVi: 'Bè Trúc Nan Mộc Hoàng Hôn',
      labelEn: 'Sunset Golden Bamboo Raft',
      descVi: 'Bè trúc vàng óng ánh nắng chiều kết từ những thân tre già dẻo dai, có gác sào tre và đèn bão nhẹ trôi bồng bềnh giữa dòng nước hoàng hôn.',
      descEn: 'A classic golden bamboo raft bound with hemp ropes, with a slender punting pole and vintage lantern drifting along the sunset river.',
      icon: '🛶',
    },
  },
  dragon_koi_falls: {
    tea_house: {
      img: '/images/zen/elements/dragon_gate.png?v=20260915_gate',
      width: 195,
      height: 186,
      xOffset: -97.5,
      yOffset: -155,
      shadowRx: 75,
      shadowRy: 22,
      labelVi: 'Cổng Tam Quan Long Môn Vượt Thác',
      labelEn: 'Dragon Gate Celestial Portal',
      descVi: 'Cổng tam quan sơn son thếp vàng chạm lộng song long chầu nguyệt, uy nghi sừng sững bên dòng thác cuộn, nơi thần ngư vượt vũ môn hóa rồng.',
      descEn: 'A majestic vermilion and gold dragon archway standing proud by the roaring falls, where carp leap the waterfall to transform into dragons.',
      icon: '⛩️',
    },
    imperial_pagoda: {
      img: '/images/zen/elements/dragon_gate.png?v=20260915_gate',
      width: 195,
      height: 186,
      xOffset: -97.5,
      yOffset: -155,
      shadowRx: 75,
      shadowRy: 22,
      labelVi: 'Cổng Tam Quan Long Môn Vượt Thác',
      labelEn: 'Dragon Gate Celestial Portal',
      descVi: 'Cổng tam quan sơn son thếp vàng chạm lộng song long chầu nguyệt, uy nghi sừng sững bên dòng thác cuộn, nơi thần ngư vượt vũ môn hóa rồng.',
      descEn: 'A majestic vermilion and gold dragon archway standing proud by the roaring falls, where carp leap the waterfall to transform into dragons.',
      icon: '⛩️',
    },
    bamboo_fountain: {
      img: '/images/zen/elements/dragon_koi_rock.png?v=20260915_koi_rock',
      width: 140,
      height: 173,
      xOffset: -70,
      yOffset: -150,
      shadowRx: 56,
      shadowRy: 18,
      labelVi: 'Bàn Thạch Thần Ngư Vượt Sóng Ghềnh',
      labelEn: 'Sacred Dragon Koi Cascading Monolith',
      descVi: 'Tảng đá bàn thạch phong rêu sừng sững giữa ngọn thác gầm, kim ngư vảy vàng lấp lánh rẽ sóng cuộn trào vươn lên mây xanh.',
      descEn: 'A moss-covered monolith amidst cascading rapids, where the golden koi surges with celestial power leaping toward the heavens.',
      icon: '🐟',
    },
    stone_lantern: {
      img: '/images/zen/elements/bamboo_red_lantern.png?v=20260915_dragon_lantern',
      width: 85,
      height: 114,
      xOffset: -42.5,
      yOffset: -100,
      shadowRx: 28,
      shadowRy: 10,
      labelVi: 'Đèn Lồng Đỏ Treo Ghềnh Long Môn',
      labelEn: 'Dragon Rapids Crimson Lantern',
      descVi: 'Lồng đèn đỏ rực rỡ đung đưa giữa hơi sương ngọn thác, soi rọi ánh hoàng kim dẫn lối ngư vượt vũ môn.',
      descEn: 'A radiant vermilion silk lantern swaying amidst waterfall mist, casting golden light to guide ascending koi.',
      icon: '🏮',
    },
    wooden_boat: {
      img: '/images/zen/elements/boat.png?v=20260915_dragon_boat',
      width: 148,
      height: 106,
      xOffset: -74,
      yOffset: -53,
      shadowRx: 68,
      shadowRy: 18,
      labelVi: 'Thuyền Long Châu Vượt Sóng Ghềnh',
      labelEn: 'Dragon Rapids Timber Vessel',
      descVi: 'Chiếc thuyền mộc màu nâu trầm kiên cố neo đậu bên bến đá, sẵn sàng rẽ sóng lướt qua dòng nước xiết của Cõi Long Ngư.',
      descEn: 'A sturdy seasoned timber boat anchored by the rock landing, built to navigate the surging waters of the Dragon Koi realm.',
      icon: '⛵',
    },
  },
  midnight_stars: {
    tea_house: {
      img: '/images/zen/elements/mushroom_cottage.png?v=20260916',
      width: 175,
      height: 180,
      xOffset: -87.5,
      yOffset: -150,
      shadowRx: 70,
      shadowRy: 20,
      labelVi: 'Chòi Nấm Dạ Quang Cổ Tích',
      labelEn: 'Bioluminescent Mushroom Cottage',
      descVi: 'Cây nấm dạ quang khổng lồ được thiết kế thành chòi nghỉ cổ tích ấm cúng với cầu thang xoắn ốc gỗ mộc và khung cửa sổ tròn phát sáng lung linh giữa rừng đêm sao.',
      descEn: 'A magical giant glowing mushroom transformed into a cozy fairy cottage with spiral wooden stairs and warm glowing round windows in the starlit forest.',
      icon: '🍄',
    },
    bamboo_fountain: {
      img: '/images/zen/elements/glowing_mushrooms_bunny.png?v=20260916',
      width: 135,
      height: 140,
      xOffset: -67.5,
      yOffset: -120,
      shadowRx: 55,
      shadowRy: 16,
      labelVi: 'Khóm Nấm Phát Sáng & Thỏ Con Ánh Sao',
      labelEn: 'Glowing Mushrooms & Star Bunny',
      descVi: 'Cụm nấm linh chi đa sắc phát sáng dạ quang soi bóng bên chú thỏ ngọc hiền lành ôm quả hồ lô sao, mang lại vẻ sinh động ngộ nghĩnh cho khu rừng đầm đêm.',
      descEn: 'A vibrant cluster of multicolored glowing mushrooms beside a gentle celestial bunny holding a starlight gourd, bringing enchanting life to the lagoon.',
      icon: '🐰',
    },
    stone_lantern: {
      img: '/images/zen/elements/starfire_orb_lantern.png?v=20260916',
      width: 95,
      height: 130,
      xOffset: -47.5,
      yOffset: -115,
      shadowRx: 30,
      shadowRy: 10,
      labelVi: 'Đèn Cầu Tinh Tú & Đom Đóm Dạ Quang',
      labelEn: 'Starfire Bioluminescent Orb',
      descVi: 'Quả cầu pha lê tinh tú treo trên nhánh cây thu hút muôn ngàn đom đóm, bọ cánh cứng ngọc và bướm đêm dạ quang dập dìu thắp sáng cả một góc trời.',
      descEn: 'A celestial crystal orb suspended from twisted boughs, attracting a swarm of gentle fireflies and iridescent night beetles.',
      icon: '✨',
    },
    wooden_boat: {
      img: '/images/zen/elements/firefly_river_raft.png?v=20260916',
      width: 150,
      height: 105,
      xOffset: -75,
      yOffset: -52,
      shadowRx: 68,
      shadowRy: 18,
      labelVi: 'Bè Thả Đèn Đom Đóm Đêm Sao',
      labelEn: 'Firefly Lantern River Raft',
      descVi: 'Chiếc bè mộc điểm xuyết rêu phát sáng lững lờ trôi mang theo những ngọn hoa đăng lung linh, thắp sáng mặt đầm tĩnh mịch dưới vòm ngân hà.',
      descEn: 'A peaceful timber raft lined with bioluminescent moss, carrying glowing river lanterns across the tranquil starry waters.',
      icon: '🛶',
    },
    wild_flower_bed: {
      img: '/images/zen/elements/stardust_moss_meadow.png?v=20260916',
      width: 120,
      height: 110,
      xOffset: -60,
      yOffset: -95,
      shadowRx: 50,
      shadowRy: 16,
      labelVi: 'Thảm Rêu Phát Sáng & Hoa Sao Li Ti',
      labelEn: 'Bioluminescent Stardust Meadow',
      descVi: 'Thảm rêu phát sáng êm như nhung điểm xuyết muôn đóa hoa sao tím biếc và thảo mộc dạ quang hé nở trong làn sương đêm tĩnh lặng.',
      descEn: 'A velvety glowing moss carpet dotted with tiny violet star-flowers and nocturnal herbs blooming peacefully in the mist.',
      icon: '🌸',
    },
  },
  glacial_phoenix_crest: {
    tea_house: {
      img: '/images/zen/elements/winter_snow_cabin.png?v=20260916',
      width: 180,
      height: 175,
      xOffset: -90,
      yOffset: -145,
      shadowRx: 72,
      shadowRy: 20,
      labelVi: 'Ngôi Nhà Gỗ Ấm Cúng Phủ Tuyết Trắng',
      labelEn: 'Cozy Winter Snow Cabin',
      descVi: 'Ngôi nhà gỗ phong cách Bắc Âu với mái dốc phủ lớp tuyết dày xốp trắng muốt, ống khói bốc làn khói ấm áp, ánh đèn vàng cam hắt qua ô cửa sổ tuyết xua tan giá lạnh phương bắc.',
      descEn: 'A charming Nordic timber cabin with thick powder snow on its gabled roof, chimney smoke curling into the crisp air, and warm amber light glowing from frosty windows.',
      icon: '🏡',
    },
    bamboo_fountain: {
      img: '/images/zen/elements/red_scarf_snowman.png?v=20260916',
      width: 115,
      height: 135,
      xOffset: -57.5,
      yOffset: -120,
      shadowRx: 45,
      shadowRy: 15,
      labelVi: 'Chú Người Tuyết Xinh Xắn Khăn Len Đỏ',
      labelEn: 'Joyful Red-Scarf Snowman',
      descVi: 'Chú người tuyết tròn trĩnh quàng khăn len đỏ thắm ấm áp, đội nón len hạt dẻ, tay cành thông vẫy chào và nở nụ cười hiền hòa đón từng bông tuyết rơi bên băng phượng.',
      descEn: 'A cheerful chubby snowman wearing a cozy red woolen scarf and pinecone hat, waving pine-twig arms with a warm smile amidst falling snowflakes.',
      icon: '⛄',
    },
    stone_lantern: {
      img: '/images/zen/elements/frosted_lantern_post.png?v=20260916',
      width: 85,
      height: 125,
      xOffset: -42.5,
      yOffset: -110,
      shadowRx: 26,
      shadowRy: 9,
      labelVi: 'Trụ Đèn Bão Mùa Đông Phủ Tuyết',
      labelEn: 'Frosted Winter Lantern Post',
      descVi: 'Cột đèn gỗ cổ điển đội chiếc nón tuyết trắng tinh khôi, ngọn đèn bão tỏa ánh sáng vàng hổ phách ấm áp sưởi ấm cho thảm tuyết xung quanh.',
      descEn: 'A classic timber lantern post crowned with pristine snow, its hurricane lamp radiating warm amber light to melt away the winter frost.',
      icon: '🏮',
    },
    wooden_boat: {
      img: '/images/zen/elements/timber_winter_sleigh.png?v=20260916',
      width: 145,
      height: 100,
      xOffset: -72.5,
      yOffset: -50,
      shadowRx: 65,
      shadowRy: 18,
      labelVi: 'Xe Trượt Tuyết Gỗ Mộc Mùa Đông',
      labelEn: 'Timber Winter Sleigh',
      descVi: 'Chiếc xe trượt tuyết bằng gỗ thông mộc lướt êm trên mặt hồ đóng băng tráng gương, sẵn sàng cho những chuyến phiêu lưu kỳ thú giữa trời đông tuyết trắng.',
      descEn: 'A handcrafted pine sleigh gliding effortlessly across the mirror-like frozen lake, ready for winter wonderland journeys.',
      icon: '🛷',
    },
    wild_flower_bed: {
      img: '/images/zen/elements/snow_rocks_blossoms.png?v=20260916',
      width: 125,
      height: 110,
      xOffset: -62.5,
      yOffset: -95,
      shadowRx: 52,
      shadowRy: 16,
      labelVi: 'Tảng Đá Phủ Tuyết & Hoa Tuyết Li Ti',
      labelEn: 'Snow-Dusted Rocks & Winter Blossoms',
      descVi: 'Tảng đá cuội phủ lớp tuyết xốp trắng xóa, bên cạnh là khóm hoa tuyết li ti và bụi cỏ mùa đông kiên cường vươn lên trong giá rét.',
      descEn: 'Frost-kissed river rocks dusted with soft snow, cradling delicate winter edelweiss and resilient frosted grasses.',
      icon: '❄️',
    },
  },
  sakura_valley: {
    tea_house: {
      img: '/images/zen/elements/fallen_petals_pavilion.png?v=20260916',
      width: 185,
      height: 180,
      xOffset: -92.5,
      yOffset: -150,
      shadowRx: 75,
      shadowRy: 20,
      labelVi: 'Lạc Anh Đình Bên Suối Đào',
      labelEn: 'Fallen Petals Pavilion',
      descVi: 'Mái đình ngập tràn cánh hoa đào rơi rụng theo gió xuân, chén trà bích loa xuân ngát hương hoa ngọc.',
      descEn: 'A secluded pavilion showered by spring sakura blossoms, fragrant with fresh mountain tea.',
      icon: '🏯',
    },
    wooden_boat: {
      img: '/images/zen/elements/sakura_blossom_boat.png?v=20260916',
      width: 145,
      height: 105,
      xOffset: -72.5,
      yOffset: -52,
      shadowRx: 65,
      shadowRy: 18,
      labelVi: 'Thuyền Hoa Đào Du Xuân',
      labelEn: 'Spring Sakura Blossom Boat',
      descVi: 'Thuyền nan mộc lướt trên mặt suối phủ đầy cánh đào hồng phấn, lưu giữ trọn vẹn phong vị mùa xuân tao nhã.',
      descEn: 'A wooden skiff gliding over river waters carpeted with sakura petals, capturing the pure essence of spring.',
      icon: '🛶',
    },
  },
  celestial_peaks: {
    tea_house: {
      labelVi: 'Chòi Nghỉ Mái Lá Cọ Ven Biển',
      labelEn: 'Tropical Seaside Cabana',
      descVi: 'Chòi gỗ mộc thoáng mát lợp mái lá cọ dừa đón gió biển trong lành, bên trong bày bộ bàn ghế gỗ ngắm sóng biển vỗ bờ cát vàng óng ả.',
      descEn: 'A breezy wooden cabana with thatched palm leaves catching fresh sea breezes, furnished for watching golden waves lap the sandy shore.',
      icon: '🏖️',
    },
    bamboo_fountain: {
      labelVi: 'Rạn Đá San Hô & Vỏ Ốc Ngọc Trai',
      labelEn: 'Coral Reefs & Pearl Seashells',
      descVi: 'Cụm đá san hô tự nhiên bên bờ biển sóng vỗ, nơi đàn cua nhỏ và những chú sao biển sắc màu sưởi ấm dưới ánh nắng nhiệt đới rực rỡ.',
      descEn: 'A natural coral rock formation by the tide, home to gentle sea crabs and colorful starfish sunbathing under tropical sunlight.',
      icon: '🐚',
    },
    stone_lantern: {
      labelVi: 'Hải Đăng Đá Cổ Kính Ven Bờ',
      labelEn: 'Coastal Stone Beacon',
      descVi: 'Ngọn hải đăng đá kiên cường sừng sững bên bãi đá ven biển, ngọn đèn dẫn đường soi rọi muôn dặm sóng biếc cho những con tàu viễn dương.',
      descEn: 'A steadfast coastal stone beacon standing watch over ocean waves, casting bright guiding rays across azure waters.',
      icon: '🗼',
    },
    wooden_boat: {
      labelVi: 'Thuyền Buồm Mộc Lướt Sóng Biển Xanh',
      labelEn: 'Tropical Wooden Sailboat',
      descVi: 'Chiếc thuyền buồm gỗ mộc thanh thoát neo đậu bên bãi cát vàng, cánh buồm trắng đón gió lướt êm trên làn nước trong vắt màu ngọc lam.',
      descEn: 'An elegant wooden sailboat resting on golden sands, its white sails ready to catch the breeze across crystalline turquoise waters.',
      icon: '⛵',
    },
    cherry_tree: {
      labelVi: 'Hàng Dừa Nhiệt Đới Nghiêng Bóng',
      labelEn: 'Swaying Tropical Coconut Palms',
      descVi: 'Hàng dừa nhiệt đới trĩu quả nghiêng mình che bóng mát bên bãi cát vàng óng ả, mang lại bầu không khí nghỉ dưỡng bình yên tuyệt đối.',
      descEn: 'Graceful coconut palms swaying in the sea breeze, casting gentle shade over warm golden sands.',
      icon: '🥥',
    },
  },
  cosmic_world_tree: {
    tea_house: {
      labelVi: 'Đại Điện Kim Các Vô Cực',
      labelEn: 'Infinite Golden Celestial Hall',
      descVi: 'Điện thờ ngự trên tầng mây ngũ sắc của Khởi Nguyên Thần Mộc, nơi hội tụ chí tôn đạo pháp và năng lượng vũ trụ viên mãn.',
      descEn: 'A celestial hall floating upon cosmic cloud tiers beneath the World Tree, sanctuary of infinite enlightenment.',
      icon: '🏛️',
    },
    stone_lantern: {
      labelVi: 'Pháp Đăng Hoàng Kim Vô Thượng',
      labelEn: 'Supreme Golden Dharma Lantern',
      descVi: 'Trụ đèn bằng vàng ròng đúc ấn thần thú, tỏa ánh hào quang thái dương chiếu rọi khắp cõi nhân gian.',
      descEn: 'A pure gold dharma beacon bearing celestial beast insignias, radiating solar radiance across all realms.',
      icon: '☀️',
    },
    wooden_boat: {
      labelVi: 'Chiến Thuyền Long Vân Bát Nhã',
      labelEn: 'Celestial Prajna Cloud Barge',
      descVi: 'Long thuyền vân du chạm trổ rồng vàng lướt trên biển mây ngũ sắc, đưa hành giả cập bến bờ giác ngộ vô lượng.',
      descEn: 'A dragon barge gliding across golden cloud seas, carrying the seeker to the shores of supreme wisdom.',
      icon: '✨',
    },
  },
};

const ITEM_RENDER_CONFIG: Record<GardenItemType, ItemRenderConfig> = {
  sakura_flower: {
    img: '/images/zen/elements/sakura_bonsai_tree.png?v=20260908b',
    width: 145,
    height: 145,
    xOffset: -72.5,
    yOffset: -130,
    shadowRx: 48,
    shadowRy: 15,
    shadowY: 8,
    dropShadow: 'drop-shadow(0 8px 18px rgba(0,0,0,0.32))',
    animate: { rotate: [-1.2, 1.2, -1.2] },
    animDuration: 5,
  },
  water_lotus: {
    img: '/images/zen/elements/lotus.png?v=20260908b',
    width: 82,
    height: 82,
    xOffset: -41,
    yOffset: -46,
    shadowRx: 36,
    shadowRy: 12,
    shadowY: 12,
    dropShadow: 'drop-shadow(0 0 16px rgba(244,114,182,0.85))',
    animate: { y: [-2, 2, -2] },
    animDuration: 4,
  },
  chrysanthemum: {
    img: '/images/zen/elements/chrysanthemum.png?v=20260908b',
    width: 75,
    height: 75,
    xOffset: -37.5,
    yOffset: -60,
    shadowRx: 26,
    shadowRy: 8,
    shadowY: 6,
    dropShadow: 'drop-shadow(0 0 12px rgba(250,204,21,0.75))',
    animate: { rotate: [-1.8, 1.8, -1.8] },
    animDuration: 4.2,
  },
  bamboo_sprout: {
    img: '/images/zen/elements/zen_bamboo.png?v=20260908b',
    width: 120,
    height: 120,
    xOffset: -60,
    yOffset: -105,
    shadowRx: 44,
    shadowRy: 12,
    shadowY: 8,
    dropShadow: 'drop-shadow(0 6px 14px rgba(0,0,0,0.28))',
    animate: { rotate: [-0.8, 0.8, -0.8] },
    animDuration: 5.5,
  },
  bonsai_tree: {
    img: '/images/zen/elements/bonsai.png?v=20260908b',
    width: 120,
    height: 120,
    xOffset: -60,
    yOffset: -105,
    shadowRx: 44,
    shadowRy: 12,
    shadowY: 8,
    dropShadow: 'drop-shadow(0 8px 16px rgba(0,0,0,0.32))',
    animate: { scale: [0.99, 1.01, 0.99] },
    animDuration: 4.8,
  },
  tea_house: {
    img: '/images/zen/elements/zen_teahouse.png?v=20260908b',
    width: 165,
    height: 165,
    xOffset: -82.5,
    yOffset: -135,
    shadowRx: 65,
    shadowRy: 18,
    shadowY: 10,
    dropShadow: 'drop-shadow(0 10px 22px rgba(0,0,0,0.35))',
  },
  stone_lantern: {
    img: '/images/zen/elements/zen_lantern.png?v=20260908b',
    width: 65,
    height: 105,
    xOffset: -32.5,
    yOffset: -96,
    shadowRx: 22,
    shadowRy: 8,
    shadowY: 6,
    dropShadow: 'drop-shadow(0 0 16px rgba(251,191,36,0.75))',
    animate: { opacity: [0.92, 1, 0.92] },
    animDuration: 2.5,
  },
  koi_fish: {
    img: '/images/zen/elements/koi.png?v=20260908b',
    width: 92,
    height: 92,
    xOffset: -46,
    yOffset: -46,
    shadowRx: 34,
    shadowRy: 12,
    shadowY: 0,
    dropShadow: 'drop-shadow(0 0 16px rgba(56,189,248,0.85))',
    animate: { x: [-6, 6, -6], y: [-3, 3, -3], rotate: [-5, 5, -5] },
    animDuration: 6,
  },
  butterflies: {
    img: '/images/zen/elements/butterflies.png?v=20260908b',
    width: 84,
    height: 84,
    xOffset: -42,
    yOffset: -42,
    shadowRx: 16,
    shadowRy: 5,
    shadowY: 38,
    dropShadow: 'drop-shadow(0 0 14px rgba(192,132,252,0.85))',
    animate: { x: [-5, 5, -5], y: [-7, 7, -7], scale: [0.96, 1.04, 0.96] },
    animDuration: 4.5,
  },
  fireflies: {
    img: '/images/zen/elements/butterflies.png?v=20260908b',
    width: 76,
    height: 76,
    xOffset: -38,
    yOffset: -38,
    shadowRx: 14,
    shadowRy: 4,
    shadowY: 32,
    dropShadow: 'drop-shadow(0 0 16px rgba(163,230,53,0.9))',
    animate: { x: [-8, 8, -8], y: [-8, 8, -8], opacity: [0.75, 1, 0.75] },
    animDuration: 3.8,
  },
  bamboo_fountain: {
    img: '/images/zen/elements/zen_fountain.png?v=20260908b',
    width: 120,
    height: 120,
    xOffset: -60,
    yOffset: -105,
    shadowRx: 50,
    shadowRy: 14,
    shadowY: 8,
    dropShadow: 'drop-shadow(0 8px 18px rgba(0,0,0,0.35))',
    animate: { rotate: [-0.5, 0.5, -0.5] },
    animDuration: 4.5,
  },
  flower_bed: {
    img: '/images/zen/elements/zen_flower_bed.png?v=20260908b',
    width: 105,
    height: 105,
    xOffset: -52.5,
    yOffset: -92,
    shadowRx: 45,
    shadowRy: 14,
    shadowY: 6,
    dropShadow: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))',
  },
  wooden_boat: {
    img: '/images/zen/elements/boat.png?v=20260915_wood',
    width: 142,
    height: 102,
    xOffset: -71,
    yOffset: -51,
    shadowRx: 66,
    shadowRy: 18,
    shadowY: 10,
    dropShadow: 'drop-shadow(0 6px 14px rgba(3,78,123,0.45))',
    animate: { y: [-3, 3, -3], rotate: [-1.2, 1.2, -1.2] },
    animDuration: 5.5,
  },
  chinese_rose: {
    img: '/images/zen/elements/chinese_rose.png?v=20260915_rose',
    width: 112,
    height: 112,
    xOffset: -56,
    yOffset: -96,
    shadowRx: 45,
    shadowRy: 14,
    shadowY: 8,
    dropShadow: 'drop-shadow(0 6px 16px rgba(0,0,0,0.32))',
    animate: { rotate: [-0.6, 0.6, -0.6] },
    animDuration: 5.2,
  },
  tea_ceremony: {
    img: '/images/zen/elements/chinese_rose.png?v=20260915_rose',
    width: 112,
    height: 112,
    xOffset: -56,
    yOffset: -96,
    shadowRx: 45,
    shadowRy: 14,
    shadowY: 8,
    dropShadow: 'drop-shadow(0 6px 16px rgba(0,0,0,0.32))',
    animate: { rotate: [-0.6, 0.6, -0.6] },
    animDuration: 5.2,
  },
  cherry_tree: {
    img: '/images/zen/elements/cherry_tree.png?v=20260915_tree',
    width: 168,
    height: 175,
    xOffset: -84,
    yOffset: -148,
    shadowRx: 65,
    shadowRy: 18,
    shadowY: 10,
    dropShadow: 'drop-shadow(0 10px 22px rgba(0,0,0,0.32))',
    animate: { rotate: [-0.8, 0.8, -0.8] },
    animDuration: 5.2,
  },
  tall_bamboo: {
    img: '/images/zen/elements/bamboo.png?v=20260908b',
    width: 125,
    height: 125,
    xOffset: -62.5,
    yOffset: -110,
    shadowRx: 45,
    shadowRy: 13,
    shadowY: 8,
    dropShadow: 'drop-shadow(0 6px 14px rgba(0,0,0,0.28))',
    animate: { rotate: [-0.8, 0.8, -0.8] },
    animDuration: 5.8,
  },
  wild_flower_bed: {
    img: '/images/zen/elements/flower_bed.png?v=20260908b',
    width: 105,
    height: 105,
    xOffset: -52.5,
    yOffset: -92,
    shadowRx: 42,
    shadowRy: 13,
    shadowY: 6,
    dropShadow: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))',
  },
  imperial_pagoda: {
    img: '/images/zen/elements/teahouse.png?v=20260908b',
    width: 160,
    height: 160,
    xOffset: -80,
    yOffset: -130,
    shadowRx: 62,
    shadowRy: 18,
    shadowY: 10,
    dropShadow: 'drop-shadow(0 10px 22px rgba(0,0,0,0.35))',
  },
};

// 🌟 18 ĐIỂM NEO CẢNH QUAN HÀI HÒA ĐỘC BẢN (ZERO-COLLISION HARMONIC SLOTS)
// Mỗi phần tử có tọa độ thiết kế riêng, phân tầng viễn cảnh (trên đồi, ven suối, trong nước, trên thảm cỏ)
// ĐẶC BIỆT: Cá Koi, Hoa Sen & Thuyền gỗ 100% ĐƯỢC ĐẶT SÂU TRONG LÒNG SÔNG NƯỚC BIẾC
export const HARMONIC_GARDEN_SLOTS: Record<GardenItemType, { x: number; y: number; scale: number }> = {
  water_lotus: { x: 345, y: 390, scale: 1.1 },        // 1. 🪷 Sen hồng & lá biếc trong lòng suối bờ Tây
  butterflies: { x: 130, y: 220, scale: 1 },          // 2. 🦋 Đôi bướm tiên đa sắc bay lượn trên thảm cỏ đồi Tây
  koi_fish: { x: 425, y: 345, scale: 1.15 },          // 3. 🐟 Đôi cá koi ngũ sắc tung tăng bơi lội dưới chân cầu
  sakura_flower: { x: 105, y: 175, scale: 1.05 },     // 4. 🌸 Cây đào nở rộ trên đỉnh đồi cỏ Tây
  stone_lantern: { x: 535, y: 265, scale: 1 },        // 5. 🏮 Đèn trụ vườn thắp sáng đầu cầu bờ Đông
  tea_house: { x: 725, y: 240, scale: 1.1 },          // 6. 🍵 Chòi nghỉ thủy tạ ngự trên đồi cỏ cao phía Đông
  bamboo_fountain: { x: 485, y: 395, scale: 1.05 },   // 7. 🎋 Thác nước trúc Shishi-odoshi bên thềm đá bờ Đông
  wooden_boat: { x: 395, y: 450, scale: 1.05 },       // 8. 🚣 Thuyền gỗ nâu cổ điển bồng bềnh giữa dòng sông
  chinese_rose: { x: 215, y: 235, scale: 1 },         // 9. 🌹 Bụi hồng cổ trang nhỏ xinh bên thềm cỏ đồi Tây
  tea_ceremony: { x: 215, y: 235, scale: 1 },         // Legacy alias
  bamboo_sprout: { x: 95, y: 395, scale: 1 },         // 10. 🌿 Khóm trúc ngọc vươn cao mép đá đồi Tây
  bonsai_tree: { x: 65, y: 310, scale: 1 },           // 11. 🌲 Tùng bonsai cổ thụ ngàn năm trên thảm cỏ Tây
  chrysanthemum: { x: 745, y: 420, scale: 1 },        // 12. 🌼 Hoa cúc vàng đón ban mai tiền cảnh bờ Đông
  cherry_tree: { x: 285, y: 215, scale: 1.05 },       // 13. 🌸 Đại thụ anh đào tự nhiên nở rộ (dàn đào đồi Tây)
  flower_bed: { x: 55, y: 460, scale: 1 },            // 14. 🌺 Bồn hoa cẩm tú rực rỡ tiền cảnh bờ cỏ Tây
  fireflies: { x: 470, y: 175, scale: 1 },            // 15. ✨ Đom đóm dạ quang lấp lánh trên dòng sông
  tall_bamboo: { x: 700, y: 340, scale: 0.95 },       // 16. 🎍 Rừng trúc xanh cao vút bạt ngàn bờ Đông
  wild_flower_bed: { x: 175, y: 440, scale: 0.95 },   // 17. 🌺 Thảm hoa rừng đa sắc ven dòng sông Tây
  imperial_pagoda: { x: 775, y: 180, scale: 0.92 },   // 18. 🏯 Thủy tạ lầu son cung đình uy nghi
};

export interface SecondarySlotConfig {
  type: GardenItemType;
  x: number;
  y: number;
  scale: number;
  variant?: GardenEntityVariant;
  labelVi?: string;
  labelEn?: string;
}

// Vị trí mở rộng khi học vượt quá 18 từ: Mỗi slot đều có biến thể màu sắc, lật đối xứng, và tên riêng độc đáo
export const SECONDARY_HARMONIC_SLOTS: SecondarySlotConfig[] = [
  {
    type: 'koi_fish',
    x: 360,
    y: 430,
    scale: 1.05,
    variant: { flipX: true, hueRotate: 45, brightness: 1.15, scaleMultiplier: 0.95 },
    labelVi: 'Cá Koi Hoàng Kim Quẫy Sóng',
    labelEn: 'Golden Swimming Koi',
  },
  {
    type: 'water_lotus',
    x: 445,
    y: 420,
    scale: 0.95,
    variant: { flipX: true, brightness: 1.3, saturate: 0.4 },
    labelVi: 'Bạch Liên Hoa Thanh Khiết',
    labelEn: 'Pure White Sacred Lotus',
  },
  {
    type: 'chrysanthemum',
    x: 135,
    y: 345,
    scale: 0.85,
    variant: { brightness: 1.25, saturate: 0.4 },
    labelVi: 'Cúc Họa Mi Trắng Sương Mai',
    labelEn: 'White Dewdrop Chrysanthemum',
  },
  {
    type: 'butterflies',
    x: 690,
    y: 325,
    scale: 0.9,
    variant: { flipX: true, hueRotate: 90 },
    labelVi: 'Bướm Tiên Dạ Quang Tím',
    labelEn: 'Luminescent Purple Fairy Butterflies',
  },
  {
    type: 'wooden_boat',
    x: 440,
    y: 380,
    scale: 0.95,
    variant: { flipX: true, scaleMultiplier: 0.9 },
    labelVi: 'Thuyền Gỗ Cổ Neo Bến Xưa',
    labelEn: 'Moored Antique Wooden Boat',
  },
  {
    type: 'wild_flower_bed',
    x: 745,
    y: 470,
    scale: 0.9,
    variant: { flipX: true, hueRotate: 45 },
    labelVi: 'Thảm Hoa Rừng Hoàng Yến',
    labelEn: 'Golden Wildflower Meadow',
  },
  {
    type: 'fireflies',
    x: 220,
    y: 170,
    scale: 0.85,
    variant: { hueRotate: 180 },
    labelVi: 'Đom Đóm Lam Tinh Thần Bí',
    labelEn: 'Azure Mystic Fireflies',
  },
  {
    type: 'bamboo_sprout',
    x: 675,
    y: 375,
    scale: 0.85,
    variant: { flipX: true, scaleMultiplier: 0.9 },
    labelVi: 'Khóm Trúc Xanh Bờ Đông',
    labelEn: 'East Bank Jade Bamboo',
  },
  {
    type: 'koi_fish',
    x: 410,
    y: 475,
    scale: 1.1,
    variant: { hueRotate: 185, brightness: 1.1, flipX: false },
    labelVi: 'Cá Koi Lam Tinh Linh',
    labelEn: 'Celestial Sapphire Koi',
  },
  {
    type: 'water_lotus',
    x: 375,
    y: 330,
    scale: 1,
    variant: { hueRotate: 260 },
    labelVi: 'Tử Liên Hoa Thạch Anh',
    labelEn: 'Amethyst Water Lily',
  },
  {
    type: 'cherry_tree',
    x: 165,
    y: 155,
    scale: 0.88,
    variant: { flipX: true, scaleMultiplier: 0.9 },
    labelVi: 'Anh Đào Tuyết Bồng Lai',
    labelEn: 'Snow Blossom Sakura',
  },
  {
    type: 'cherry_tree',
    x: 340,
    y: 185,
    scale: 0.86,
    variant: { flipX: true, brightness: 1.05 },
    labelVi: 'Cây Anh Đào Bờ Đông Vọng Cảnh',
    labelEn: 'East Bank Sakura Grove',
  },
  {
    type: 'chinese_rose',
    x: 165,
    y: 360,
    scale: 0.92,
    variant: { flipX: true, hueRotate: 15 },
    labelVi: 'Bụi Hồng Phấn Sương Mai',
    labelEn: 'Pink Dewdrop Rose Bush',
  },
  {
    type: 'bonsai_tree',
    x: 770,
    y: 290,
    scale: 0.92,
    variant: { flipX: true, hueRotate: -30 },
    labelVi: 'Tùng Phong Đỏ Mùa Thu',
    labelEn: 'Autumn Scarlet Bonsai',
  },
  {
    type: 'stone_lantern',
    x: 275,
    y: 285,
    scale: 0.9,
    variant: { flipX: true, scaleMultiplier: 0.9 },
    labelVi: 'Đèn Đá Dẫn Lối Bờ Tây',
    labelEn: 'West Path Stone Lantern',
  },
];

// Thứ tự tuần tự mở khóa 18 phần tử hoàn toàn độc bản khi trả lời đúng
export const HARMONIC_UNLOCK_SEQUENCE: GardenItemType[] = [
  'water_lotus',
  'butterflies',
  'koi_fish',
  'sakura_flower',
  'stone_lantern',
  'tea_house',
  'bamboo_fountain',
  'wooden_boat',
  'chinese_rose',
  'bamboo_sprout',
  'bonsai_tree',
  'chrysanthemum',
  'cherry_tree',
  'flower_bed',
  'fireflies',
  'tall_bamboo',
  'wild_flower_bed',
  'imperial_pagoda',
];

export const generateGardenEntityByIndex = (index: number): GardenEntity => {
  let chosenType: GardenItemType;
  let slotPos: { x: number; y: number; scale: number };
  let variant: GardenEntityVariant | undefined;
  let customLabelVi: string | undefined;
  let customLabelEn: string | undefined;

  const isSec = index >= HARMONIC_UNLOCK_SEQUENCE.length;

  if (!isSec) {
    chosenType = HARMONIC_UNLOCK_SEQUENCE[index];
    slotPos = HARMONIC_GARDEN_SLOTS[chosenType];
    const jitterRot = ((index * 7) % 9) - 4;
    variant = { rotationJitter: jitterRot };
  } else {
    const secIdx = (index - HARMONIC_UNLOCK_SEQUENCE.length) % SECONDARY_HARMONIC_SLOTS.length;
    const sec = SECONDARY_HARMONIC_SLOTS[secIdx];
    const cycle = Math.floor((index - HARMONIC_UNLOCK_SEQUENCE.length) / SECONDARY_HARMONIC_SLOTS.length);
    const jitterX = ((cycle * 19) % 31) - 15;
    const jitterY = ((cycle * 13) % 21) - 10;
    chosenType = sec.type;
    slotPos = { x: sec.x + jitterX, y: sec.y + jitterY, scale: sec.scale };
    variant = { ...sec.variant, rotationJitter: ((cycle * 5) % 9) - 4 };
    customLabelVi = sec.labelVi;
    customLabelEn = sec.labelEn;
  }

  const catalogInfo = GARDEN_CATALOG[chosenType];

  return {
    id: isSec ? `garden-sec-${index}-${chosenType}` : `garden-${index}-${chosenType}`,
    type: chosenType,
    x: slotPos.x,
    y: slotPos.y,
    scale: slotPos.scale,
    labelVi: customLabelVi || catalogInfo.labelVi,
    labelEn: customLabelEn || catalogInfo.labelEn,
    descVi: catalogInfo.descVi,
    descEn: catalogInfo.descEn,
    createdAt: Date.now() + index,
    variant,
  };
};

// --- 🎨 RENDER INDIVIDUAL LIVING GARDEN ELEMENT WITH REAL HIGH-ART SPRITES ---
function renderGardenItem(
  item: GardenEntity,
  onInspect: (info: GardenEntity) => void,
  _isExpanded?: boolean,
  _biome?: BiomeConfig,
  dragProps?: {
    isDragging: boolean;
    isArrangeMode: boolean;
    onPointerDown: (e: React.PointerEvent, item: GardenEntity, posX: number, posY: number) => void;
  }
) {
  const baseCfg = ITEM_RENDER_CONFIG[item.type] || ITEM_RENDER_CONFIG.sakura_flower;
  const realmOverrides = (_biome?.id && REALM_ITEM_OVERRIDES[_biome.id]?.[item.type]) || null;
  const cfg = realmOverrides
    ? {
        ...baseCfg,
        img: realmOverrides.img || baseCfg.img,
        width: realmOverrides.width ?? baseCfg.width,
        height: realmOverrides.height ?? baseCfg.height,
        xOffset: realmOverrides.xOffset ?? baseCfg.xOffset,
        yOffset: realmOverrides.yOffset ?? baseCfg.yOffset,
        shadowRx: realmOverrides.shadowRx ?? baseCfg.shadowRx,
        shadowRy: realmOverrides.shadowRy ?? baseCfg.shadowRy,
      }
    : baseCfg;
  const isKoi = item.type === 'koi_fish';
  const isLotus = item.type === 'water_lotus';
  const isBoat = item.type === 'wooden_boat';

  // 🎯 TỌA ĐỘ VẬT THỂ: Ưu tiên tọa độ người chơi tùy biến (kéo thả) hoặc tọa độ vàng mặc định
  const isSecondary = item.id.includes('sec-');
  const defaultSlot = HARMONIC_GARDEN_SLOTS[item.type];
  let posX = typeof item.x === 'number' ? item.x : defaultSlot ? defaultSlot.x : 400;
  let posY = typeof item.y === 'number' ? item.y : defaultSlot ? defaultSlot.y : 250;
  let effectiveScale = typeof item.scale === 'number' ? item.scale : defaultSlot ? defaultSlot.scale : 1;

  if (!item.customPos && !isSecondary && defaultSlot) {
    // 18 phần tử cốt lõi lấy đúng tọa độ vàng nếu người chơi chưa kéo thả
    posX = defaultSlot.x;
    posY = defaultSlot.y;
    effectiveScale = defaultSlot.scale;
  } else if (!item.customPos && (isKoi || isLotus || isBoat)) {
    // Nếu chưa kéo thả mà tọa độ lệch ra bờ thì ép về lòng sông
    if (posX < 320 || posX > 480 || posY < 320) {
      posX = defaultSlot ? defaultSlot.x : (isBoat ? 395 : isKoi ? 425 : 345);
      posY = defaultSlot ? defaultSlot.y : (isBoat ? 450 : isKoi ? 345 : 390);
    }
  }

  // Giới hạn tuyệt đối trong khung cảnh quan khu vườn (0..800, 0..500)
  posX = Math.max(35, Math.min(765, posX));
  posY = Math.max(90, Math.min(475, posY));

  // Variant styling: màu sắc, lật đối xứng, độ sáng & độ nghiêng tự nhiên
  const v = item.variant;
  const flipX = v?.flipX;
  const hueRotate = v?.hueRotate || 0;
  const brightness = v?.brightness || 1;
  const saturate = v?.saturate || 1;
  const rotationJitter = v?.rotationJitter || 0;
  const scaleMult = v?.scaleMultiplier || 1;
  effectiveScale = effectiveScale * scaleMult;

  const filterStyle = `${cfg.dropShadow} ${hueRotate ? `hue-rotate(${hueRotate}deg)` : ''} ${brightness !== 1 ? `brightness(${brightness})` : ''} ${saturate !== 1 ? `saturate(${saturate})` : ''}`.trim();

  const isDragging = dragProps?.isDragging || false;
  const isArrangeMode = dragProps?.isArrangeMode || false;

  return (
    <g
      key={item.id}
      transform={`translate(${posX}, ${posY})`}
      className={`${isDragging ? 'cursor-grabbing' : isArrangeMode ? 'cursor-grab' : 'cursor-pointer hover:cursor-grab'} pointer-events-auto select-none group`}
      onPointerDown={(e) => {
        dragProps?.onPointerDown(e, item, posX, posY);
      }}
    >
      {/* 🧭 Vòng định vị phong thủy khi đang ở chế độ Bày Trí hoặc đang kéo thả */}
      {(isArrangeMode || isDragging) && (
        <g pointerEvents="none">
          <ellipse
            cx="0"
            cy={cfg.shadowY + 4}
            rx={(cfg.shadowRx * effectiveScale) + 12}
            ry={(cfg.shadowRy * effectiveScale) + 7}
            fill={isDragging ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.08)'}
            stroke={isDragging ? '#fbbf24' : '#34d399'}
            strokeWidth={isDragging ? 2.5 : 1.4}
            strokeDasharray={isDragging ? '4 3' : '3 3'}
            opacity={isDragging ? 0.95 : 0.65}
          />
        </g>
      )}

      {/* Soft Ground / Water Shadow in 3D perspective */}
      <ellipse
        cx="0"
        cy={isDragging ? cfg.shadowY + 12 : cfg.shadowY}
        rx={isDragging ? (cfg.shadowRx * effectiveScale * 0.85) : (cfg.shadowRx * effectiveScale)}
        ry={isDragging ? (cfg.shadowRy * effectiveScale * 0.85) : (cfg.shadowRy * effectiveScale)}
        fill={isKoi || isLotus || isBoat ? '#034e7b' : '#062e1d'}
        opacity={isDragging ? 0.2 : (isKoi ? 0.6 : isLotus ? 0.45 : isBoat ? 0.55 : 0.34)}
        filter={isDragging ? 'blur(6px)' : 'blur(3px)'}
      />

      {/* 🌊 UNDERWATER SWIMMING RIPPLES & GLOW FOR KOI FISH */}
      {isKoi && (
        <g pointerEvents="none">
          {/* Làn nước xoáy xanh ngọc dưới thân cá */}
          <ellipse cx="0" cy="0" rx="46" ry="28" fill={hueRotate ? '#0ea5e9' : '#0284c7'} opacity="0.28" filter="blur(6px)" />
          {/* Vòng sóng lăn tăn đồng tâm mở rộng */}
          <motion.ellipse
            cx="0"
            cy="0"
            rx="48"
            ry="30"
            stroke={hueRotate === 45 ? '#fde047' : '#bae6fd'}
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
            animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.55, 0.15, 0.55] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.ellipse
            cx="0"
            cy="0"
            rx="32"
            ry="20"
            stroke="#ffffff"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
            animate={{ scale: [1.1, 0.85, 1.1], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
      )}

      {/* 🪷 GỢN NƯỚC CHO HOA SEN NỔI TRÊN MẶT SUỐI */}
      {isLotus && (
        <g pointerEvents="none">
          <motion.ellipse
            cx="0"
            cy="8"
            rx="36"
            ry="14"
            stroke="#7dd3fc"
            strokeWidth="1.2"
            fill="none"
            opacity="0.45"
            animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
      )}

      {/* 🚣 GỢN NƯỚC BỒNG BỀNH CHO THUYỀN NAN TRÊN DÒNG NƯỚC */}
      {isBoat && (
        <g pointerEvents="none">
          <motion.ellipse
            cx="0"
            cy="10"
            rx="54"
            ry="18"
            stroke="#7dd3fc"
            strokeWidth="1.2"
            fill="none"
            opacity="0.45"
            animate={{ scale: [0.92, 1.14, 0.92], opacity: [0.5, 0.15, 0.5] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
      )}

      {/* 🦋 ĐÔI BƯỚM TIÊN TỰ NHIÊN / ✨ ĐOM ĐÓM / 🎨 CÁC SPRITE ĐỒ HỌA THỰC THỂ KHÁC */}
      {item.type === 'butterflies' ? (
        <motion.g
          animate={{
            x: flipX ? [6, -8, 4, -6, 6] : [-6, 8, -4, 6, -6],
            y: [-8, 4, -10, 2, -8],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            filter: hueRotate ? `hue-rotate(${hueRotate}deg)` : undefined,
            transform: flipX ? 'scaleX(-1)' : undefined,
          }}
        >
          {/* Con bướm 1: Bướm vàng hoàng yến (Golden Swallowtail) vỗ cánh dập dờn */}
          <motion.g transform="translate(-16, -8) scale(1.15)">
            <motion.g
              animate={{ scaleX: [1, 0.18, 1], rotate: [-4, 4, -4] }}
              transition={{ duration: 0.28, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '0 0' }}
            >
              {/* Cánh trước & Cánh sau */}
              <path d="M 0 0 C -4 -6 -12 -12 -16 -8 C -18 -4 -12 2 -4 4 Z" fill="#f59e0b" />
              <path d="M 0 0 C -2 -3 -8 -7 -10 -5 C -11 -2 -7 1 -2 2 Z" fill="#fde047" />
              <path d="M 0 1 C -3 5 -9 9 -11 6 C -12 3 -7 0 -2 0 Z" fill="#d97706" />
              <path d="M 0 0 C 4 -6 12 -12 16 -8 C 18 -4 12 2 4 4 Z" fill="#f59e0b" />
              <path d="M 0 0 C 2 -3 8 -7 10 -5 C 11 -2 7 1 2 2 Z" fill="#fde047" />
              <path d="M 0 1 C 3 5 9 9 11 6 C 12 3 7 0 2 0 Z" fill="#d97706" />
            </motion.g>
            {/* Thân bướm & Râu */}
            <ellipse cx="0" cy="0" rx="1.2" ry="5" fill="#451a03" />
            <path d="M -0.5 -4 Q -3 -8 -4 -9" stroke="#451a03" strokeWidth="0.6" fill="none" />
            <circle cx="-4" cy="-9" r="0.6" fill="#f59e0b" />
            <path d="M 0.5 -4 Q 3 -8 4 -9" stroke="#451a03" strokeWidth="0.6" fill="none" />
            <circle cx="4" cy="-9" r="0.6" fill="#f59e0b" />
          </motion.g>

          {/* Con bướm 2: Bướm xanh ngọc (Azure Morpho) chao liệng quấn quýt */}
          <motion.g
            transform="translate(16, 10) scale(0.95) rotate(15)"
            animate={{ y: [-3, 3, -3], x: [-2, 2, -2] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          >
            <motion.g
              animate={{ scaleX: [1, 0.18, 1], rotate: [4, -4, 4] }}
              transition={{ duration: 0.24, repeat: Infinity, ease: 'easeInOut', delay: 0.08 }}
              style={{ transformOrigin: '0 0' }}
            >
              <path d="M 0 0 C -3 -5 -10 -10 -13 -7 C -15 -3 -10 2 -3 3 Z" fill="#0284c7" />
              <path d="M 0 0 C -2 -3 -7 -6 -9 -4 C -10 -2 -6 1 -2 2 Z" fill="#7dd3fc" />
              <path d="M 0 1 C -2 4 -8 7 -9 5 C -10 2 -6 0 -2 0 Z" fill="#0369a1" />
              <path d="M 0 0 C 3 -5 10 -10 13 -7 C 15 -3 10 2 3 3 Z" fill="#0284c7" />
              <path d="M 0 0 C 2 -3 7 -6 9 -4 C 10 -2 6 1 2 2 Z" fill="#7dd3fc" />
              <path d="M 0 1 C 2 4 8 7 9 5 C 10 2 6 0 2 0 Z" fill="#0369a1" />
            </motion.g>
            <ellipse cx="0" cy="0" rx="1" ry="4" fill="#0c4a6e" />
            <path d="M -0.4 -3 Q -2 -6 -3 -7" stroke="#0c4a6e" strokeWidth="0.5" fill="none" />
            <path d="M 0.4 -3 Q 2 -6 3 -7" stroke="#0c4a6e" strokeWidth="0.5" fill="none" />
          </motion.g>
        </motion.g>
      ) : item.type === 'fireflies' ? (
        /* ✨ ĐOM ĐÓM PHÁT SÁNG DỊU DÀNG (GENTLE PULSING FIREFLIES) */
        <g pointerEvents="none" style={{ filter: hueRotate ? `hue-rotate(${hueRotate}deg)` : undefined }}>
          {[
            { x: -16, y: -12, s: 2.5, d: 0 },
            { x: 14, y: -6, s: 3.2, d: 0.8 },
            { x: -6, y: 14, s: 2.8, d: 1.6 },
            { x: 20, y: 16, s: 2.2, d: 2.3 },
          ].map((f, fi) => (
            <motion.g
              key={fi}
              transform={`translate(${f.x}, ${f.y})`}
              animate={{
                x: [0, (fi % 2 === 0 ? 6 : -6), 0],
                y: [0, -8, 0],
                opacity: [0.35, 1, 0.35],
                scale: [0.85, 1.25, 0.85],
              }}
              transition={{ duration: 3.2, delay: f.d, repeat: Infinity, ease: 'easeInOut' }}
            >
              <circle cx="0" cy="0" r={f.s * 3} fill="#a3e635" opacity="0.3" filter="blur(3px)" />
              <circle cx="0" cy="0" r={f.s} fill="#fef08a" />
              <circle cx="0" cy="0" r={f.s * 0.5} fill="#ffffff" />
            </motion.g>
          ))}
        </g>
      ) : (
        <motion.g
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{
            scale: isDragging ? effectiveScale * 1.15 : effectiveScale,
            opacity: 1,
            y: isDragging ? -12 : 0,
          }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          whileHover={{ scale: isDragging ? effectiveScale * 1.15 : effectiveScale * 1.08, y: isDragging ? -12 : -3 }}
        >
          <motion.g
            animate={cfg.animate || {}}
            transition={{ duration: cfg.animDuration || 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              transform: `${flipX ? 'scaleX(-1)' : ''} ${rotationJitter ? `rotate(${rotationJitter}deg)` : ''}`.trim() || undefined,
              transformOrigin: '0 0',
            }}
          >
            <image
              href={cfg.img}
              x={cfg.xOffset}
              y={cfg.yOffset}
              width={cfg.width}
              height={cfg.height}
              preserveAspectRatio="xMidYMid meet"
              style={{ filter: filterStyle }}
            />
          </motion.g>
        </motion.g>
      )}

      {/* 🌊 LÀN NƯỚC TRONG VẮT KHÚC XẠ PHỦ LÊN LƯNG CÁ KOI BƠI DƯỚI LÒNG SUỐI */}
      {isKoi && (
        <motion.ellipse
          cx="0"
          cy="0"
          rx="40"
          ry="24"
          fill="#38bdf8"
          opacity="0.2"
          filter="blur(4px)"
          pointerEvents="none"
          animate={{ scale: [0.94, 1.06, 0.94], opacity: [0.12, 0.24, 0.12] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </g>
  );
}

// --- 🌄 GRAND PANORAMIC LIVING SANCTUARY CANVAS ---
function GrandZenCanvas({
  biome,
  gardenEntities,
  guardian,
  guardianStar,
  isExpanded,
  onToggleExpand,
  onInspectGarden,
  onOpenFullscreenGuardian,
  onOpenRealmSelector,
  completedCount = 0,
  currentCard,
  onPrevCard,
  onNextCard,
  onSpeakWord,
  onResetGarden,
  onUpdateItemPosition,
  onResetLayout,
  onPlaceCatalogItem,
  onStoreCatalogItem,
}: {
  biome: BiomeConfig;
  gardenEntities: GardenEntity[];
  guardian?: MythicAssetInfo;
  guardianStar?: number;
  completedCount?: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onInspectGarden: (info: GardenEntity) => void;
  onOpenFullscreenGuardian?: () => void;
  onOpenRealmSelector?: () => void;
  currentCard?: FlashcardItem;
  onPrevCard?: () => void;
  onNextCard?: () => void;
  onSpeakWord?: (text: string) => void;
  onResetGarden?: () => void;
  onUpdateItemPosition?: (id: string, x: number, y: number) => void;
  onResetLayout?: () => void;
  onPlaceCatalogItem?: (type: GardenItemType) => void;
  onStoreCatalogItem?: (type: GardenItemType) => void;
}) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isArrangeMode, setIsArrangeMode] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [inventoryCategory, setInventoryCategory] = useState<'all' | 'architecture' | 'flora' | 'fauna'>('all');

  const dragSessionRef = useRef<{
    id: string;
    itemStartX: number;
    itemStartY: number;
    pointerStartX: number;
    pointerStartY: number;
    svgStartX: number;
    svgStartY: number;
    isMoved: boolean;
  } | null>(null);

  const getSvgCoords = (clientX: number, clientY: number) => {
    if (svgRef.current) {
      const pt = svgRef.current.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svgRef.current.getScreenCTM();
      if (ctm) {
        const transformed = pt.matrixTransform(ctm.inverse());
        return {
          x: Math.max(35, Math.min(765, Math.round(transformed.x))),
          y: Math.max(90, Math.min(475, Math.round(transformed.y))),
        };
      }
      const rect = svgRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          x: Math.max(35, Math.min(765, Math.round(((clientX - rect.left) / rect.width) * 800))),
          y: Math.max(90, Math.min(475, Math.round(((clientY - rect.top) / rect.height) * 500))),
        };
      }
    }
    return { x: 400, y: 250 };
  };

  const handleItemPointerDown = (
    e: React.PointerEvent,
    item: GardenEntity,
    currentX: number,
    currentY: number
  ) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();

    const svgPt = getSvgCoords(e.clientX, e.clientY);
    dragSessionRef.current = {
      id: item.id,
      itemStartX: currentX,
      itemStartY: currentY,
      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
      svgStartX: svgPt.x,
      svgStartY: svgPt.y,
      isMoved: false,
    };

    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {
      // fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragSessionRef.current) return;
    const session = dragSessionRef.current;
    const dist = Math.hypot(e.clientX - session.pointerStartX, e.clientY - session.pointerStartY);
    if (!session.isMoved && dist < 5) {
      return;
    }

    if (!session.isMoved) {
      session.isMoved = true;
      setDraggingId(session.id);
    }

    const svgPt = getSvgCoords(e.clientX, e.clientY);
    const deltaX = svgPt.x - session.svgStartX;
    const deltaY = svgPt.y - session.svgStartY;

    const newX = Math.max(35, Math.min(765, Math.round(session.itemStartX + deltaX)));
    const newY = Math.max(90, Math.min(475, Math.round(session.itemStartY + deltaY)));

    onUpdateItemPosition?.(session.id, newX, newY);
  };

  const handlePointerUp = (_e: React.PointerEvent) => {
    if (!dragSessionRef.current) return;
    const session = dragSessionRef.current;
    const { id, isMoved } = session;
    dragSessionRef.current = null;
    setDraggingId(null);

    if (!isMoved) {
      // Tap/click without dragging -> inspect
      const clicked = gardenEntities.find((el) => el.id === id);
      if (clicked) {
        onInspectGarden(clicked);
      }
    } else {
      playZenTapSound();
    }
  };

  // 🌿 TIẾN TRÌNH VƯỜN HOANG SƠ TỪ SỐ 0 (Pristine Garden Progression)
  // Ban đầu: chỉ có trời, núi, sông, cỏ xanh (chưa có cầu, hoa, bướm, lá sen).
  // Từ đúng 1: Dựng cây cầu son Vermilion Moon Bridge & nảy mầm thực thể hoa sen đầu tiên.
  // Từ đúng 2: Hoa dại nở rộ ven đường, lá sen nổi trên nước, bướm/hạt khí quyển kéo đến.
  // Từ đúng 3+: Hoa tử đằng buông rủ trên lan can cầu, đàn cá koi bơi lội, tùng bonsai, nhà tranh...
  const hasBridge = completedCount >= 1 || gardenEntities.length >= 1;
  const hasWildflowers = completedCount >= 2 || gardenEntities.length >= 2;
  const hasLilyPads = completedCount >= 2 || gardenEntities.length >= 2;
  const hasWisteria = completedCount >= 3 || gardenEntities.length >= 3;
  const hasParticles = completedCount >= 2 || gardenEntities.length >= 2;

  return (
    <div
      className={
        isExpanded
          ? 'fixed inset-0 z-40 w-screen h-screen flex flex-col items-center justify-center p-2 sm:p-6 overflow-hidden shadow-none border-0 transition-all duration-500 select-none'
          : 'w-full relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 border-2 border-white/40 dark:border-slate-800 aspect-[16/10] max-h-[480px] min-h-[300px]'
      }
      style={{ background: biome.skyGradient }}
    >
      <div className={isExpanded ? 'relative w-full h-full max-w-[1360px] max-h-[850px] flex items-center justify-center' : 'w-full h-full relative'}>
        <svg
          ref={svgRef}
          className={`w-full h-full block select-none ${draggingId ? 'cursor-grabbing' : isArrangeMode ? 'cursor-default' : ''}`}
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid meet"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
          {/* --- SHADERS & GRADIENTS FOR HIGH-AESTHETIC LIVING SANCTUARY --- */}
          {/* 1. Sakura Petals & Woody Bark */}
          <linearGradient id="sakuraPetalGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fbcfe8" />
            <stop offset="80%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
          <linearGradient id="sakuraBarkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="40%" stopColor="#78350f" />
            <stop offset="80%" stopColor="#9a3412" />
            <stop offset="100%" stopColor="#291003" />
          </linearGradient>

          {/* 2. Sacred Water Lotus & Glistening Pad */}
          <linearGradient id="lotusPinkGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fdf2f8" />
            <stop offset="75%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>
          <linearGradient id="lotusPetalPureGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fce7f3" />
            <stop offset="85%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
          <radialGradient id="lotusLeafGrad" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="85%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </radialGradient>

          {/* 3. Golden Imperial Chrysanthemum */}
          <linearGradient id="chrysanthemumGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#facc15" />
            <stop offset="80%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* 4. 3D Cylindrical Bamboo Stalk & Nodal Joints */}
          <linearGradient id="bambooStalkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#14532d" />
            <stop offset="25%" stopColor="#22c55e" />
            <stop offset="60%" stopColor="#86efac" />
            <stop offset="85%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#052e16" />
          </linearGradient>
          <linearGradient id="bambooJointGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#052e16" />
            <stop offset="50%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#052e16" />
          </linearGradient>

          {/* 5. Ancient Pine Bonsai - Rich Anime Green */}
          <linearGradient id="bonsaiFoliageGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dcfce7" />
            <stop offset="20%" stopColor="#86efac" />
            <stop offset="55%" stopColor="#22c55e" />
            <stop offset="85%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="bonsaiBarkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1c1917" />
            <stop offset="25%" stopColor="#3d2012" />
            <stop offset="55%" stopColor="#78350f" />
            <stop offset="80%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#1c1917" />
          </linearGradient>
          <linearGradient id="bonsaiPotGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="40%" stopColor="#475569" />
            <stop offset="75%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* 6. Lakeside Tea Pavilion & Shoji Window */}
          <linearGradient id="teaHouseRoofGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
          <linearGradient id="teaHouseWallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <radialGradient id="shojiLanternGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
          </radialGradient>

          {/* 7. Granite Stone Lantern & Flame */}
          <linearGradient id="stoneGraniteGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <radialGradient id="lanternFlameGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#fef08a" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" />
          </radialGradient>

          {/* 8. Swimming Nishikigoi Koi */}
          <linearGradient id="koiOrangeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="45%" stopColor="#f97316" />
            <stop offset="85%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
          <linearGradient id="koiScaleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffedd5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fdba74" stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id="koiPoolGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.7" />
            <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="80%" stopColor="#0284c7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#075985" stopOpacity="0.95" />
          </radialGradient>
          <linearGradient id="koiGoldGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="30%" stopColor="#fde047" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>

          {/* 9. Celestial Butterflies - Enhanced with hindwing gradients */}
          <linearGradient id="butterflyWingRose" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="30%" stopColor="#f9a8d4" />
            <stop offset="65%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#9d174d" />
          </linearGradient>
          <linearGradient id="butterflyHindRose" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fdf2f8" />
            <stop offset="40%" stopColor="#fbcfe8" />
            <stop offset="80%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>
          <linearGradient id="butterflyWingAzure" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="30%" stopColor="#7dd3fc" />
            <stop offset="65%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="butterflyHindAzure" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="40%" stopColor="#bae6fd" />
            <stop offset="80%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* 10. Bioluminescent Firefly Glow */}
          <radialGradient id="fireflyGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#a3e635" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#65a30d" stopOpacity="0" />
          </radialGradient>

          {/* 11. Hydrangea Planter Globes */}
          <radialGradient id="hydrangeaBlueGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="40%" stopColor="#38bdf8" />
            <stop offset="80%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>
          <radialGradient id="hydrangeaLilacGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fdf4ff" />
            <stop offset="40%" stopColor="#c084fc" />
            <stop offset="80%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#6b21a8" />
          </radialGradient>
          <radialGradient id="hydrangeaPinkGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fdf2f8" />
            <stop offset="40%" stopColor="#f472b6" />
            <stop offset="80%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#9d174d" />
          </radialGradient>

          {/* 12. Celestial Sun, Moon, Meteor & Atmospheric Shaders */}
          <radialGradient id="sunCoronaGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#fef08a" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#fde047" stopOpacity="0.45" />
            <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sunCoreGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#fde047" />
          </radialGradient>
          <radialGradient id="moonHaloGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#c7d2fe" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#818cf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shootingStarGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor="#93c5fd" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>

          {/* 13. Water, Caustics, Mist & God Rays */}
          <linearGradient id="waterShimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="streamWaterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
            <stop offset="35%" stopColor="#0284c7" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="godRayGrad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={biome.godRayColor || '#fef08a'} stopOpacity="0.32" />
            <stop offset="100%" stopColor={biome.godRayColor || '#fef08a'} stopOpacity="0" />
          </linearGradient>

          {/* 14. Volumetric Shaded Clouds */}
          <linearGradient id="fluffyCloudGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="60%" stopColor={biome.cloudTint || '#f8fafc'} stopOpacity="0.92" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.65" />
          </linearGradient>

          {/* 15. Vermilion Bridge & Cobblestones */}
          <linearGradient id="bridgeVermilionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="35%" stopColor="#ef4444" />
            <stop offset="70%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <linearGradient id="bridgeRailGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="50%" stopColor="#fca5a5" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
          <linearGradient id="cobbleStoneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* 16. Master Artist Shaders for Realistic Living Garden */}
          <linearGradient id="artistBarkMahoganyGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a0f07" />
            <stop offset="20%" stopColor="#3d2110" />
            <stop offset="48%" stopColor="#63391b" />
            <stop offset="75%" stopColor="#8d5229" />
            <stop offset="90%" stopColor="#45230e" />
            <stop offset="100%" stopColor="#1a0f07" />
          </linearGradient>
          <linearGradient id="artistSakuraBarkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#220e06" />
            <stop offset="25%" stopColor="#451e12" />
            <stop offset="50%" stopColor="#693320" />
            <stop offset="78%" stopColor="#8c472e" />
            <stop offset="100%" stopColor="#220e06" />
          </linearGradient>
          <linearGradient id="artistSakuraPetalGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fdf2f8" />
            <stop offset="75%" stopColor="#f472b6" />
            <stop offset="95%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
          <linearGradient id="artistLotusPetalGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#fce7f3" />
            <stop offset="70%" stopColor="#f472b6" />
            <stop offset="92%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#9d174d" />
          </linearGradient>
          <linearGradient id="artistPineNeedleGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#052e16" />
            <stop offset="30%" stopColor="#14532d" />
            <stop offset="65%" stopColor="#16a34a" />
            <stop offset="88%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#bbf7d0" />
          </linearGradient>
          <linearGradient id="artistChrysanthemumGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="30%" stopColor="#d97706" />
            <stop offset="65%" stopColor="#f59e0b" />
            <stop offset="90%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="artistBambooCulmGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#052e16" />
            <stop offset="18%" stopColor="#15803d" />
            <stop offset="52%" stopColor="#4ade80" />
            <stop offset="78%" stopColor="#86efac" />
            <stop offset="90%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#052e16" />
          </linearGradient>
          <linearGradient id="artistCeladonPotGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ccfbf1" />
            <stop offset="30%" stopColor="#5eead4" />
            <stop offset="65%" stopColor="#14b8a6" />
            <stop offset="90%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#134e4a" />
          </linearGradient>
          <radialGradient id="artistDewdropGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#e0f2fe" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
          </radialGradient>

          {/* ═══════════ 🎨 PERSPECTIVE GARDEN GRADIENTS ═══════════ */}
          <linearGradient id="pgGrassLeft" x1="0.1" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={biome.grassGradientLeft ? biome.grassGradientLeft[0] : '#7bc67e'} />
            <stop offset="40%" stopColor={biome.grassGradientLeft ? biome.grassGradientLeft[1] : '#4caf50'} />
            <stop offset="75%" stopColor={biome.grassGradientLeft ? biome.grassGradientLeft[2] : '#2e7d32'} />
            <stop offset="100%" stopColor={biome.grassGradientLeft ? biome.grassGradientLeft[3] : '#1b5e20'} />
          </linearGradient>
          <linearGradient id="pgGrassRight" x1="0.9" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor={biome.grassGradientRight ? biome.grassGradientRight[0] : '#7bc67e'} />
            <stop offset="40%" stopColor={biome.grassGradientRight ? biome.grassGradientRight[1] : '#4caf50'} />
            <stop offset="75%" stopColor={biome.grassGradientRight ? biome.grassGradientRight[2] : '#2e7d32'} />
            <stop offset="100%" stopColor={biome.grassGradientRight ? biome.grassGradientRight[3] : '#1b5e20'} />
          </linearGradient>
          <linearGradient id="pgPathSurface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8c8c8" />
            <stop offset="30%" stopColor="#e0e0e0" />
            <stop offset="70%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#f8f8f8" />
          </linearGradient>
          <linearGradient id="pgPathEdgeL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9e9e9e" />
            <stop offset="100%" stopColor="#bdbdbd" />
          </linearGradient>
          <linearGradient id="pgPathEdgeR" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#9e9e9e" />
            <stop offset="100%" stopColor="#bdbdbd" />
          </linearGradient>
          <radialGradient id="pgSkyGlow" cx="72%" cy="14%" r="52%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pgHorizonFog" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pgTreeTrunk" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3e2723" />
            <stop offset="35%" stopColor="#6d4c41" />
            <stop offset="68%" stopColor="#8d6e63" />
            <stop offset="100%" stopColor="#3e2723" />
          </linearGradient>
          <radialGradient id="pgSakuraBloom" cx="45%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#fce4ec" />
            <stop offset="35%" stopColor="#f48fb1" />
            <stop offset="75%" stopColor="#e91e63" />
            <stop offset="100%" stopColor="#880e4f" />
          </radialGradient>
          <radialGradient id="pgLeafGreen" cx="42%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#c8e6c9" />
            <stop offset="38%" stopColor="#66bb6a" />
            <stop offset="78%" stopColor="#388e3c" />
            <stop offset="100%" stopColor="#1b5e20" />
          </radialGradient>
          <radialGradient id="pgMushroomCap" cx="48%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#ff8a65" />
            <stop offset="48%" stopColor="#f44336" />
            <stop offset="100%" stopColor="#b71c1c" />
          </radialGradient>
          <radialGradient id="pgMushroomCapYellow" cx="48%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#fff176" />
            <stop offset="48%" stopColor="#ffd600" />
            <stop offset="100%" stopColor="#f57f17" />
          </radialGradient>
          <linearGradient id="pgTulipRed" x1="0.3" y1="1" x2="0.7" y2="0">
            <stop offset="0%" stopColor="#b71c1c" />
            <stop offset="40%" stopColor="#ef5350" />
            <stop offset="80%" stopColor="#ffcdd2" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="pgTulipPink" x1="0.3" y1="1" x2="0.7" y2="0">
            <stop offset="0%" stopColor="#880e4f" />
            <stop offset="42%" stopColor="#f06292" />
            <stop offset="80%" stopColor="#fce4ec" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="pgTulipWhite" x1="0.3" y1="1" x2="0.7" y2="0">
            <stop offset="0%" stopColor="#90a4ae" />
            <stop offset="42%" stopColor="#eceff1" />
            <stop offset="80%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="pgLavender" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#4a148c" />
            <stop offset="42%" stopColor="#ab47bc" />
            <stop offset="78%" stopColor="#e1bee7" />
            <stop offset="100%" stopColor="#f3e5f5" />
          </linearGradient>
          <linearGradient id="pgSunflower" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#e65100" />
            <stop offset="45%" stopColor="#ffb300" />
            <stop offset="88%" stopColor="#fff9c4" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <radialGradient id="pgSunflowerCenter" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#6d4c41" />
            <stop offset="60%" stopColor="#4e342e" />
            <stop offset="100%" stopColor="#3e2723" />
          </radialGradient>
          <linearGradient id="pgHyacinth" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#1a237e" />
            <stop offset="42%" stopColor="#5c6bc0" />
            <stop offset="82%" stopColor="#c5cae9" />
            <stop offset="100%" stopColor="#e8eaf6" />
          </linearGradient>
          <linearGradient id="riverWaterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.88" />
            <stop offset="35%" stopColor="#0ea5e9" stopOpacity="0.92" />
            <stop offset="70%" stopColor="#0284c7" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="crystalWaterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={biome.waterGradientCustom ? biome.waterGradientCustom[0] : '#38bdf8'} stopOpacity="0.88" />
            <stop offset="35%" stopColor={biome.waterGradientCustom ? biome.waterGradientCustom[1] : '#0ea5e9'} stopOpacity="0.92" />
            <stop offset="70%" stopColor={biome.waterGradientCustom ? biome.waterGradientCustom[2] : '#0284c7'} stopOpacity="0.96" />
            <stop offset="100%" stopColor={biome.waterGradientCustom ? biome.waterGradientCustom[3] : '#0369a1'} stopOpacity="1" />
          </linearGradient>
        </defs>


        {/* ═══════════════════════════════════════════════════════════
            ☀️ / 🌙  CELESTIAL SLIVER (BẦU TRỜI & ĐỈNH NÚI XA: Y = 0..110)
        ═══════════════════════════════════════════════════════════ */}
        {biome.isNight ? (
          <g>
            {[
              { x: 50, y: 22, s: 1.5, d: 0 },
              { x: 140, y: 35, s: 1.0, d: 1.1 },
              { x: 220, y: 18, s: 1.8, d: 2.3 },
              { x: 310, y: 40, s: 1.2, d: 0.8 },
              { x: 390, y: 20, s: 1.6, d: 1.7 },
              { x: 480, y: 38, s: 1.0, d: 2.9 },
              { x: 560, y: 18, s: 1.4, d: 0.5 },
              { x: 640, y: 42, s: 1.2, d: 2.1 },
              { x: 180, y: 55, s: 1.4, d: 1.4 },
              { x: 430, y: 55, s: 1.0, d: 2.6 },
            ].map((st, idx) => (
              <motion.g
                key={idx}
                transform={`translate(${st.x}, ${st.y})`}
                animate={{ scale: [st.s * 0.7, st.s * 1.35, st.s * 0.7], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 3.2, delay: st.d, repeat: Infinity, ease: 'easeInOut' }}
              >
                <circle cx="0" cy="0" r={st.s} fill="#ffffff" />
              </motion.g>
            ))}
            <g transform="translate(680, 45)">
              <circle cx="0" cy="0" r="38" fill="url(#moonHaloGrad)" filter="blur(6px)" />
              <circle cx="0" cy="0" r="22" fill="#f8fafc" filter="drop-shadow(0 0 12px #a5b4fc)" />
              <circle cx="8" cy="-5" r="20" fill="#0b101b" />
            </g>
          </g>
        ) : (
          <g>
            <g transform="translate(670, 48)">
              <motion.circle
                cx="0"
                cy="0"
                r="55"
                fill="url(#sunCoronaGrad)"
                animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <circle cx="0" cy="0" r="36" fill="url(#sunCoronaGrad)" opacity="0.9" />
              <circle cx="0" cy="0" r="22" fill="url(#sunCoreGrad)" filter="drop-shadow(0 0 16px #fde047)" />
            </g>
          </g>
        )}

        {/* ☁️ DRIFTING VOLUMETRIC CLOUDS */}
        <motion.g
          animate={{ x: [-180, 850] }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          opacity="0.55"
          pointerEvents="none"
        >
          <g transform="translate(0, 18) scale(0.7)">
            <path
              d="M 20 40 Q 20 22 40 22 Q 52 8 75 14 Q 98 4 118 18 Q 135 12 148 26 Q 165 26 165 42 Q 165 54 140 54 L 20 54 Z"
              fill="url(#fluffyCloudGrad)"
              filter="drop-shadow(0 4px 8px rgba(0,0,0,0.06))"
            />
          </g>
        </motion.g>

        {/* ═══════════════════════════════════════════════════════════
            🏞️ KHU VƯỜN ZEN 80% DIỆN TÍCH: THẢM CỎ & HỒ NƯỚC TRONG VẮT
            Từ Y = 110 đến Y = 500 là toàn bộ cảnh quan khu vườn & dòng nước!
        ═══════════════════════════════════════════════════════════ */}

        {/* --- 1. Rặng núi & đồi xa viền chân trời (Y = 55..110) --- */}
        <path
          d="M -30 65 Q 110 35 260 60 Q 420 25 580 55 Q 700 30 830 65 L 830 115 L -30 115 Z"
          fill={biome.mountainColor}
          opacity="0.32"
        />
        <path
          d="M -30 80 Q 150 50 340 85 Q 530 55 830 85 L 830 115 L -30 115 Z"
          fill={biome.mountainColor}
          opacity="0.55"
        />
        <rect x="0" y="95" width="800" height="22" fill="url(#pgHorizonFog)" pointerEvents="none" opacity="0.6" />

        {/* --- 2. Bờ Cỏ Xanh Phía Tây (Lawn & Western Hill) --- */}
        <path
          d="M -20 105 L 340 115 C 330 170 280 220 280 260 C 270 310 100 365 80 505 L -20 505 Z"
          fill="url(#pgGrassLeft)"
        />
        <path
          d="M 340 115 C 330 170 280 220 280 260 C 270 310 100 365 80 505"
          stroke={biome.grassStroke || '#15803d'}
          strokeWidth="3.5"
          fill="none"
          opacity="0.75"
        />

        {/* --- 3. Bờ Cỏ Xanh Phía Đông (Lawn & Eastern Shore) --- */}
        <path
          d="M 820 105 L 440 115 C 450 170 510 220 510 260 C 520 310 690 365 720 505 L 820 505 Z"
          fill="url(#pgGrassRight)"
        />
        <path
          d="M 440 115 C 450 170 510 220 510 260 C 520 310 690 365 720 505"
          stroke={biome.grassStroke || '#15803d'}
          strokeWidth="3.5"
          fill="none"
          opacity="0.75"
        />

        {/* --- 4. Đại Hồ Nước & Dòng Suối Trong Vắt (Vast Crystal Koi Lake & Stream) --- */}
        <path
          d="M 340 115 C 330 170 280 220 280 260 C 270 310 100 365 80 505 L 720 505 C 690 365 520 310 510 260 C 510 220 450 170 440 115 Z"
          fill="url(#crystalWaterGrad)"
        />

        {/* Lớp ánh sáng nước hồ mênh mang & chiều sâu lòng hồ */}
        <ellipse cx="395" cy="380" rx="240" ry="95" fill="#38bdf8" opacity="0.14" filter="blur(22px)" pointerEvents="none" />
        <ellipse cx="395" cy="400" rx="160" ry="60" fill="#0284c7" opacity="0.18" filter="blur(18px)" pointerEvents="none" />

        {/* 🪨 DẢI ĐÁ CUỘI TỰ NHIÊN VIỀN BỜ HỒ (SHORELINE COBBLESTONES) */}
        <g pointerEvents="none">
          {/* Viền đá bờ Tây - phân cách rạch ròi giữa thảm cỏ và mặt nước */}
          {[
            { cx: 275, cy: 275, r: 8 },
            { cx: 250, cy: 305, r: 10 },
            { cx: 205, cy: 335, r: 11 },
            { cx: 155, cy: 370, r: 12 },
            { cx: 120, cy: 405, r: 13 },
            { cx: 95, cy: 445, r: 14 },
            { cx: 82, cy: 485, r: 15 },
          ].map((st, i) => (
            <g key={`shore-west-${i}`}>
              <ellipse cx={st.cx + 2} cy={st.cy + 3} rx={st.r} ry={st.r * 0.55} fill="#0f172a" opacity="0.25" />
              <ellipse cx={st.cx} cy={st.cy} rx={st.r} ry={st.r * 0.55} fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
              <ellipse cx={st.cx - 2} cy={st.cy - 1} rx={st.r * 0.55} ry={st.r * 0.35} fill="#f1f5f9" opacity="0.75" />
            </g>
          ))}

          {/* Viền đá bờ Đông - phân cách thảm cỏ Đông và mặt nước */}
          {[
            { cx: 515, cy: 275, r: 8 },
            { cx: 540, cy: 305, r: 10 },
            { cx: 585, cy: 335, r: 11 },
            { cx: 635, cy: 370, r: 12 },
            { cx: 670, cy: 405, r: 13 },
            { cx: 695, cy: 445, r: 14 },
            { cx: 710, cy: 485, r: 15 },
          ].map((st, i) => (
            <g key={`shore-east-${i}`}>
              <ellipse cx={st.cx + 2} cy={st.cy + 3} rx={st.r} ry={st.r * 0.55} fill="#0f172a" opacity="0.25" />
              <ellipse cx={st.cx} cy={st.cy} rx={st.r} ry={st.r * 0.55} fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
              <ellipse cx={st.cx - 2} cy={st.cy - 1} rx={st.r * 0.55} ry={st.r * 0.35} fill="#f1f5f9" opacity="0.75" />
            </g>
          ))}
        </g>

        {/* 🪷 CÁC CỤM LÁ SEN TỰ NHIÊN DẬP DỀNH TRÊN MẶT ĐẠI HỒ */}
        {[
          { cx: 180, cy: 380, rx: 18, ry: 8, rot: 15 },
          { cx: 280, cy: 460, rx: 22, ry: 10, rot: -8 },
          { cx: 560, cy: 345, rx: 18, ry: 9, rot: 20 },
          { cx: 630, cy: 430, rx: 24, ry: 11, rot: -15 },
          { cx: 240, cy: 425, rx: 16, ry: 8, rot: 5 },
          { cx: 420, cy: 465, rx: 19, ry: 9, rot: -10 },
          { cx: 520, cy: 375, rx: 17, ry: 8, rot: 12 },
        ].map((pad, idx) => (
          <g key={`ambient-pad-${idx}`} transform={`rotate(${pad.rot} ${pad.cx} ${pad.cy})`} pointerEvents="none">
            <ellipse cx={pad.cx + 1} cy={pad.cy + 2} rx={pad.rx} ry={pad.ry} fill="#064e3b" opacity="0.35" />
            <ellipse cx={pad.cx} cy={pad.cy} rx={pad.rx} ry={pad.ry} fill="#10b981" />
            <ellipse cx={pad.cx - 2} cy={pad.cy - 1} rx={pad.rx * 0.7} ry={pad.ry * 0.7} fill="#34d399" opacity="0.6" />
            <path d={`M ${pad.cx} ${pad.cy} L ${pad.cx + pad.rx} ${pad.cy - 1}`} stroke="#047857" strokeWidth="0.8" />
          </g>
        ))}

        {/* Sỏi đá cuội chìm dưới đáy nước trong vắt */}
        {[
          { cx: 250, cy: 360, rx: 18, ry: 9 },
          { cx: 520, cy: 350, rx: 20, ry: 10 },
          { cx: 310, cy: 460, rx: 22, ry: 11 },
          { cx: 580, cy: 470, rx: 24, ry: 12 },
          { cx: 370, cy: 220, rx: 15, ry: 7 },
          { cx: 425, cy: 225, rx: 16, ry: 8 },
        ].map((st, i) => (
          <ellipse
            key={`submerged-stone-${i}`}
            cx={st.cx}
            cy={st.cy}
            rx={st.rx}
            ry={st.ry}
            fill="#075985"
            opacity="0.4"
            filter="blur(1px)"
          />
        ))}

        {/* Gợn sóng lăn tăn phản chiếu ánh sáng trên mặt nước đại hồ */}
        {[
          { x: 395, y: 175, w: 45 },
          { x: 395, y: 235, w: 70 },
          { x: 395, y: 300, w: 120 },
          { x: 395, y: 355, w: 220 },
          { x: 395, y: 415, w: 300 },
          { x: 395, y: 470, w: 380 },
        ].map((r, i) => (
          <motion.path
            key={`stream-ripple-${i}`}
            d={`M ${r.x - r.w / 2} ${r.y} Q ${r.x} ${r.y - 2} ${r.x + r.w / 2} ${r.y}`}
            stroke="#ffffff"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.5"
            fill="none"
            animate={{ opacity: [0.25, 0.65, 0.25], y: [-0.6, 0.6, -0.6] }}
            transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
          />
        ))}

        {/* Làn sương nước ban mai mờ ảo trên hồ */}
        <ellipse cx="395" cy="190" rx="50" ry="10" fill="#ffffff" opacity="0.2" filter="blur(6px)" pointerEvents="none" />
        <ellipse cx="400" cy="420" rx="160" ry="32" fill="#ffffff" opacity="0.16" filter="blur(12px)" pointerEvents="none" />

        {/* 🌿 THẢM CỎ & LỐI ĐI LÁT ĐÁ CUỘI TỰ NHIÊN (STEPPING STONES) */}
        <g opacity="0.9" pointerEvents="none">
          {/* Lối đi lát đá bờ Tây dẫn lên cầu */}
          {[
            { cx: 120, cy: 295, rx: 14, ry: 8, rot: -10 },
            { cx: 170, cy: 285, rx: 15, ry: 9, rot: 15 },
            { cx: 220, cy: 275, rx: 16, ry: 9, rot: -5 },
            { cx: 270, cy: 270, rx: 16, ry: 9, rot: 10 },
          ].map((s, idx) => (
            <g key={`step-left-${idx}`} transform={`rotate(${s.rot} ${s.cx} ${s.cy})`}>
              <ellipse cx={s.cx + 1} cy={s.cy + 2} rx={s.rx} ry={s.ry} fill="#14532d" opacity="0.3" />
              <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
              <ellipse cx={s.cx - 2} cy={s.cy - 1} rx={s.rx * 0.7} ry={s.ry * 0.6} fill="#f8fafc" opacity="0.8" />
            </g>
          ))}

          {/* Lối đi lát đá bờ Đông dẫn từ cầu sang vọng lâu */}
          {[
            { cx: 525, cy: 270, rx: 16, ry: 9, rot: 8 },
            { cx: 580, cy: 265, rx: 15, ry: 9, rot: -12 },
            { cx: 635, cy: 260, rx: 15, ry: 9, rot: 15 },
            { cx: 690, cy: 255, rx: 14, ry: 8, rot: -8 },
          ].map((s, idx) => (
            <g key={`step-right-${idx}`} transform={`rotate(${s.rot} ${s.cx} ${s.cy})`}>
              <ellipse cx={s.cx + 1} cy={s.cy + 2} rx={s.rx} ry={s.ry} fill="#14532d" opacity="0.3" />
              <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
              <ellipse cx={s.cx - 2} cy={s.cy - 1} rx={s.rx * 0.7} ry={s.ry * 0.6} fill="#f8fafc" opacity="0.8" />
            </g>
          ))}

          {/* Chiều sâu thảm cỏ xanh mướt */}
          <ellipse cx="45" cy="360" rx="45" ry="32" fill="#22c55e" opacity="0.22" filter="blur(8px)" />
          <ellipse cx="755" cy="340" rx="45" ry="35" fill="#22c55e" opacity="0.22" filter="blur(8px)" />
          <ellipse cx="40" cy="460" rx="40" ry="24" fill="#15803d" opacity="0.25" filter="blur(6px)" />
          <ellipse cx="760" cy="460" rx="40" ry="25" fill="#15803d" opacity="0.25" filter="blur(6px)" />
        </g>

        {/* ═══════════════════════════════════════════════════════════
            ⛩️ CÂY CẦU NGHỆ THUẬT CAO (CHỈ XUẤT HIỆN KHI ĐÚNG TỪ THỨ 1)
        ═══════════════════════════════════════════════════════════ */}
        {hasBridge && (
          <g transform="translate(395, 260)" pointerEvents="none">
            <motion.g
              initial={{ opacity: 0, y: 35, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Bóng cầu in dưới làn nước trong vắt */}
              <ellipse cx="0" cy="42" rx="85" ry="18" fill="#082f49" opacity="0.4" filter="blur(8px)" />
              <image
                href="/images/zen/elements/bridge.png"
                x="-120"
                y="-105"
                width="240"
                height="160"
                preserveAspectRatio="xMidYMid meet"
                style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.35))' }}
              />
            </motion.g>
          </g>
        )}

        {/* Khí quyển mờ ảo chân trời */}
        <ellipse cx="670" cy="48" rx="110" ry="90" fill="url(#pgSkyGlow)" pointerEvents="none" opacity="0.4" />

        {/* ═══════════════════════════════════════════════════════════
            🍃 BIOME-SPECIFIC ATMOSPHERIC PARTICLES
        ═══════════════════════════════════════════════════════════ */}
        {hasParticles && (
          <>
            {biome.particleType === 'sakura' && (
              <g pointerEvents="none">
                {[
                  { x: 80, y: 50, d: 0 },
                  { x: 280, y: 110, d: 1.2 },
                  { x: 480, y: 70, d: 2.5 },
                  { x: 680, y: 140, d: 3.7 },
                  { x: 190, y: 220, d: 4.8 },
                  { x: 590, y: 280, d: 2.1 },
                ].map((p, idx) => (
                  <motion.path
                    key={idx}
                    d="M 0 0 C -3 -5 -1 -9 3 -7 C 7 -5 5 -1 0 0 Z"
                    fill="#f472b6"
                    opacity="0.85"
                    animate={{
                      x: [p.x, p.x + 65, p.x + 130],
                      y: [p.y, p.y + 75, p.y + 160],
                      rotate: [0, 140, 360],
                      opacity: [0, 0.85, 0],
                    }}
                    transition={{ duration: 7, delay: p.d, repeat: Infinity, ease: 'linear' }}
                  />
                ))}
              </g>
            )}
            {biome.particleType === 'ember' && (
              <g pointerEvents="none">
                {[
                  { x: 140, y: 310, d: 0 },
                  { x: 320, y: 330, d: 1.4 },
                  { x: 520, y: 320, d: 2.7 },
                  { x: 230, y: 280, d: 3.8 },
                  { x: 640, y: 340, d: 1.9 },
                ].map((p, idx) => (
                  <motion.circle
                    key={idx}
                    r="2.2"
                    fill="#fde047"
                    animate={{
                      x: [p.x, p.x - 20, p.x + 15],
                      y: [p.y, p.y - 90, p.y - 180],
                      opacity: [0, 0.9, 0],
                      scale: [0.8, 1.4, 0.6],
                    }}
                    transition={{ duration: 5.5, delay: p.d, repeat: Infinity, ease: 'easeOut' }}
                  />
                ))}
              </g>
            )}
            {biome.particleType === 'stardust' && (
              <g pointerEvents="none">
                {[
                  { x: 120, y: 190, d: 0 },
                  { x: 370, y: 165, d: 1.5 },
                  { x: 560, y: 215, d: 2.8 },
                  { x: 260, y: 240, d: 4.1 },
                  { x: 670, y: 180, d: 2.3 },
                ].map((p, idx) => (
                  <motion.g
                    key={idx}
                    transform={`translate(${p.x},${p.y})`}
                    animate={{ scale: [0.5, 1.4, 0.5], opacity: [0.2, 0.95, 0.2], y: [0, -15, 0] }}
                    transition={{ duration: 4.2, delay: p.d, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <circle cx="0" cy="0" r="2.6" fill="#a5f3fc" opacity="0.4" filter="blur(1px)" />
                    <circle cx="0" cy="0" r="1.4" fill="#ffffff" />
                  </motion.g>
                ))}
              </g>
            )}
            {biome.particleType === 'celestial' && (
              <g pointerEvents="none">
                {[
                  { x: 170, y: 150, d: 0 },
                  { x: 420, y: 115, d: 1.3 },
                  { x: 610, y: 175, d: 2.6 },
                  { x: 290, y: 200, d: 3.9 },
                ].map((p, idx) => (
                  <motion.g
                    key={idx}
                    transform={`translate(${p.x},${p.y})`}
                    animate={{ scale: [0.6, 1.5, 0.6], opacity: [0.2, 1, 0.2], rotate: [0, 90, 180] }}
                    transition={{ duration: 3.8, delay: p.d, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <polygon points="0,-4 1,-1 4,0 1,1 0,4 -1,1 -4,0 -1,-1" fill="#fde047" />
                  </motion.g>
                ))}
              </g>
            )}
            {biome.particleType === 'spore' && (
              <g pointerEvents="none">
                {[
                  { x: 200, y: 280, d: 0 },
                  { x: 390, y: 310, d: 1.6 },
                  { x: 580, y: 270, d: 3.1 },
                ].map((p, idx) => (
                  <motion.circle
                    key={idx}
                    r="2.4"
                    fill="#6ee7b7"
                    animate={{ x: [p.x, p.x + 15, p.x - 10], y: [p.y, p.y - 60, p.y - 120], opacity: [0, 0.8, 0] }}
                    transition={{ duration: 6, delay: p.d, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ))}
              </g>
            )}
            {biome.particleType === 'aurora' && (
              <g pointerEvents="none">
                {[
                  { x: 110, y: 200, d: 0 },
                  { x: 290, y: 175, d: 1.2 },
                  { x: 480, y: 215, d: 2.4 },
                  { x: 650, y: 165, d: 3.6 },
                  { x: 370, y: 250, d: 1.8 },
                ].map((p, idx) => (
                  <motion.g
                    key={idx}
                    transform={`translate(${p.x},${p.y})`}
                    animate={{ y: [0, -45, -90], x: [0, Math.sin(idx + 1) * 15, 0], opacity: [0, 0.9, 0], scale: [0.6, 1.4, 0.6] }}
                    transition={{ duration: 5.5, delay: p.d, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <circle cx="0" cy="0" r="3.5" fill="#67e8f9" opacity="0.5" filter="blur(1px)" />
                    <circle cx="0" cy="0" r="1.5" fill="#e0f2fe" />
                  </motion.g>
                ))}
              </g>
            )}
            {biome.particleType === 'butterfly' && (
              <g pointerEvents="none">
                {[
                  { x: 150, y: 280, d: 0, c1: '#d8b4fe', c2: '#a855f7', h: '#c084fc' },
                  { x: 400, y: 220, d: 1.5, c1: '#fbcfe8', c2: '#ec4899', h: '#f9a8d4' },
                  { x: 610, y: 290, d: 2.8, c1: '#bae6fd', c2: '#38bdf8', h: '#7dd3fc' },
                  { x: 260, y: 310, d: 3.9, c1: '#fde68a', c2: '#f59e0b', h: '#fde047' },
                ].map((p, idx) => (
                  <motion.g
                    key={idx}
                    animate={{
                      x: [p.x, p.x + 35, p.x - 15, p.x + 50, p.x],
                      y: [p.y, p.y - 45, p.y - 70, p.y - 110, p.y - 140],
                      opacity: [0, 0.85, 0.9, 0.7, 0],
                    }}
                    transition={{ duration: 7.5, delay: p.d, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.g
                      animate={{ scaleX: [1, 0.1, 1] }}
                      transition={{ duration: 0.3, repeat: Infinity, ease: 'easeInOut', delay: p.d * 0.4 }}
                      style={{ transformOrigin: '0 1px' }}
                    >
                      <path d={`M 0 1 C -2 -3 -6 -8 -8 -5 C -9 -2 -6 1 -3 2 Z`} fill={p.c1} opacity="0.92" />
                      <path d={`M 0 1 C -1 3 -5 6 -6 4 C -7 2 -4 0 -2 1 Z`} fill={p.h} opacity="0.85" />
                      <path d={`M 0 1 C 2 -3 6 -8 8 -5 C 9 -2 6 1 3 2 Z`} fill={p.c1} opacity="0.92" />
                      <path d={`M 0 1 C 1 3 5 6 6 4 C 7 2 4 0 2 1 Z`} fill={p.h} opacity="0.85" />
                    </motion.g>
                    <ellipse cx="0" cy="1" rx="0.6" ry="3" fill={p.c2} opacity="0.9" />
                    <path d="M 0 -1 Q -1.5 -4 -2.5 -5" stroke={p.c2} strokeWidth="0.4" fill="none" />
                    <circle cx="-2.5" cy="-5" r="0.5" fill={p.c1} />
                    <path d="M 0 -1 Q 1.5 -4 2.5 -5" stroke={p.c2} strokeWidth="0.4" fill="none" />
                    <circle cx="2.5" cy="-5" r="0.5" fill={p.c1} />
                  </motion.g>
                ))}
              </g>
            )}
          </>
        )}

        {/* 🌸 Render all blooming flowers, growing trees, houses, koi & butterflies */}
        {/* 🔢 Y-SORT ALGORITHM: objects with higher y (closer to viewer) drawn LAST = on top */}
        {gardenEntities
          .slice()
          .sort((a, b) => (draggingId === a.id ? 1 : draggingId === b.id ? -1 : a.y - b.y))
          .map((el) =>
            renderGardenItem(el, onInspectGarden, isExpanded, biome, {
              isDragging: draggingId === el.id,
              isArrangeMode,
              onPointerDown: handleItemPointerDown,
            })
          )}
      </svg>
    </div>

      {/* 📐 FLOATING ARRANGE MODE GUIDE BANNER */}
      <AnimatePresence>
        {isArrangeMode && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.94 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-950/92 text-amber-200 border border-amber-400/60 shadow-2xl text-[11px] font-bold backdrop-blur-md select-none pointer-events-auto"
          >
            <span className="flex items-center gap-1.5">
              <Move size={12} className="text-amber-400 animate-pulse" />
              <span>{isVi ? 'Kéo thả vật thể bất kỳ để tự do tạo bố cục vườn' : 'Drag & drop any object to customize layout'}</span>
            </span>
            <span className="opacity-35">|</span>
            {onResetLayout && (
              <button
                type="button"
                onClick={onResetLayout}
                className="text-amber-400 hover:text-white underline font-extrabold transition-colors cursor-pointer"
                title={isVi ? 'Khôi phục vị trí mặc định ban đầu' : 'Reset positions'}
              >
                {isVi ? 'Bố cục gốc' : 'Reset layout'}
              </button>
            )}
            <span className="opacity-35">|</span>
            <button
              type="button"
              onClick={() => setIsInventoryOpen((prev) => !prev)}
              className="flex items-center gap-1 text-emerald-400 hover:text-white font-extrabold transition-colors cursor-pointer"
              title={isVi ? 'Mở túi cảnh vật / kho đồ tự do bày trí' : 'Open garden storage bag'}
            >
              <Package size={11} />
              <span>{isVi ? 'Túi Cảnh Vật' : 'Open Bag'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsArrangeMode(false)}
              className="ml-1 text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar Badges & Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenRealmSelector?.()}
            className="px-3.5 py-1.5 rounded-full text-xs font-black backdrop-blur-md bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-emerald-400/60 shadow-md flex items-center gap-2 hover:border-emerald-500 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title={isVi ? 'Bấm để mở Bản Đồ Cảnh Giới Cõi' : 'Click to open Realm Selection Map'}
          >
            <Compass size={14} className="text-emerald-600 dark:text-emerald-400 group-hover:rotate-45 transition-transform" />
            <span>{isVi ? biome.accentBadgeVi : biome.accentBadgeEn}</span>
            <span className="opacity-30">|</span>
            <span className="font-bold text-emerald-800 dark:text-emerald-300">{isVi ? biome.nameVi : biome.nameEn}</span>
            {isExpanded && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">
                • {t('zen_btn_fullscreen')}
              </span>
            )}
          </button>

          {/* Nút Bật/Tắt Chế Độ Kéo Thả Bày Trí Vườn */}
          <button
            type="button"
            onClick={() => setIsArrangeMode((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-md border shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
              isArrangeMode
                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/60 shadow-amber-400/40 scale-105'
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 hover:bg-white border-white/60 hover:scale-105'
            }`}
            title={isVi ? 'Bật/tắt chế độ kéo thả sắp xếp các vật thể trong vườn' : 'Toggle garden arrange & drag mode'}
          >
            <Move size={13} className={isArrangeMode ? 'text-slate-950 animate-bounce' : 'text-emerald-600'} />
            <span>{isVi ? (isArrangeMode ? 'Đang Bày Trí' : 'Bày Trí Vườn') : (isArrangeMode ? 'Arranging' : 'Arrange')}</span>
          </button>

          {/* Nút Bật/Tắt Túi Cảnh Vật (Kho Bày Trí) */}
          <button
            type="button"
            onClick={() => setIsInventoryOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-md border shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
              isInventoryOpen
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-400/60 shadow-emerald-500/40 scale-105'
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 hover:bg-white border-white/60 hover:scale-105'
            }`}
            title={isVi ? 'Mở túi cảnh vật / kho đồ tự do bày trí' : 'Open garden storage / inventory drawer'}
          >
            <Package size={13} className={isInventoryOpen ? 'text-slate-950 animate-bounce' : 'text-emerald-600'} />
            <span>{isVi ? 'Túi Cảnh Vật' : 'Bag'}</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              {gardenEntities.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Mythic Guardian Companion Widget - Icon nhỏ gọn trên thanh điều khiển (Bấm để ngắm full màn hình 1 linh thú này) */}
          {guardian && (
            <button
              onClick={() => onOpenFullscreenGuardian?.()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-slate-900/85 hover:bg-slate-900 text-white border border-amber-400/50 shadow-md hover:border-amber-300 hover:scale-105 transition-all cursor-pointer group"
              title={isVi ? `${guardian.labelVi} • Bấm để ngắm toàn màn hình` : `${guardian.labelEn} • Click to view fullscreen`}
            >
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-amber-400 shrink-0 shadow-sm">
                <img
                  src={guardian.image}
                  alt={isVi ? guardian.labelVi : guardian.labelEn}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <span className="text-[11px] font-bold text-amber-300 hidden sm:inline max-w-[90px] truncate">
                {isVi ? guardian.labelVi : guardian.labelEn}
              </span>
              {guardianStar !== undefined && (
                <span className="text-[9px] font-black text-amber-300 bg-amber-400/20 border border-amber-400/40 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={9} className="fill-amber-400 text-amber-400" />
                  <span>{guardianStar}</span>
                </span>
              )}
            </button>
          )}

          {/* Maximize / Minimize Button */}
          <button
            onClick={onToggleExpand}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border shadow-md transition-all cursor-pointer font-black text-xs ${
              isExpanded
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500'
                : 'bg-white/85 dark:bg-slate-900/85 text-slate-800 dark:text-slate-100 hover:bg-white border-white/50'
            }`}
            title={isExpanded ? t('zen_btn_exit_fullscreen') : t('zen_btn_fullscreen')}
          >
            {isExpanded ? (
              <>
                <Minimize2 size={14} />
                <span>{t('zen_btn_exit_fullscreen')}</span>
              </>
            ) : (
              <>
                <Maximize2 size={14} className="text-emerald-600" />
                <span className="hidden sm:inline">{t('zen_btn_fullscreen')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Floating Stats / HUD Bar */}
      {isExpanded ? (
        <div className="absolute bottom-5 inset-x-4 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 px-5 py-3 rounded-2xl backdrop-blur-md bg-slate-950/85 text-white border border-amber-400/40 shadow-2xl pointer-events-auto z-10">
          {currentCard ? (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => onSpeakWord?.(currentCard.front)}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition-colors shrink-0"
                title={t('zen_hud_speak')}
              >
                <Volume2 size={16} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-base text-amber-300 tracking-wide truncate">
                    {currentCard.front}
                  </span>
                  <span className="text-[10px] text-slate-400">➔</span>
                  <span className="font-bold text-xs text-emerald-300 truncate">
                    {currentCard.back}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>🌸 {gardenEntities.length} {t('zen_garden_items_count')}</span>
                  {gardenEntities.length > 0 && onResetGarden && (
                    <button
                      type="button"
                      onClick={onResetGarden}
                      className="text-[9px] text-slate-400 hover:text-rose-400 transition-colors hover:underline cursor-pointer flex items-center gap-0.5"
                      title={isVi ? 'Gieo lại cảnh vật khu vườn' : 'Replant garden'}
                    >
                      <RotateCcw size={9} />
                      <span>{isVi ? 'Gieo lại' : 'Replant'}</span>
                    </button>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span>🌸 {gardenEntities.length} {t('zen_garden_items_count')}</span>
              {gardenEntities.length > 0 && onResetGarden && (
                <button
                  type="button"
                  onClick={onResetGarden}
                  className="text-[9px] text-slate-400 hover:text-rose-400 transition-colors hover:underline cursor-pointer flex items-center gap-0.5"
                  title={isVi ? 'Gieo lại cảnh vật khu vườn' : 'Replant garden'}
                >
                  <RotateCcw size={9} />
                  <span>{isVi ? 'Gieo lại' : 'Replant'}</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {onPrevCard && (
              <button
                onClick={onPrevCard}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer transition-colors"
              >
                {t('zen_hud_prev')}
              </button>
            )}
            {onNextCard && (
              <button
                onClick={onNextCard}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md cursor-pointer transition-colors"
              >
                {t('zen_hud_next')}
              </button>
            )}
            <button
              onClick={onToggleExpand}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-xs font-bold text-rose-300 cursor-pointer transition-colors border border-rose-500/30"
            >
              {t('zen_btn_exit_fullscreen')}
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between px-4 py-2.5 rounded-2xl backdrop-blur-md bg-white/80 dark:bg-slate-900/80 text-xs font-extrabold text-slate-800 dark:text-slate-100 border border-white/40 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Flame size={14} className="animate-bounce" />
              {isVi ? `Cõi ${biome.nameVi}` : `Realm: ${biome.nameEn}`}
            </span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              🌸 {gardenEntities.length} {t('zen_garden_items_count')}
            </span>
            {gardenEntities.length > 0 && onResetGarden && (
              <button
                type="button"
                onClick={onResetGarden}
                className="text-[10px] text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-1 px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer flex items-center gap-1"
                title={isVi ? 'Gieo lại cảnh vật khu vườn từ đầu' : 'Replant garden from scratch'}
              >
                <RotateCcw size={10} />
                <span>{isVi ? 'Gieo lại' : 'Replant'}</span>
              </button>
            )}
          </div>
          <div className="text-[11px] font-semibold italic text-slate-600 dark:text-slate-300 hidden sm:block">
            {gardenEntities.length === 0
              ? isVi
                ? '🌱 Trả lời đúng để bắt đầu dựng cầu & khai mở hoa cỏ...'
                : '🌱 Answer correctly to build the bridge & bloom sanctuary...'
              : `"${isVi ? biome.ambientNoteVi : biome.ambientNoteEn}"`}
          </div>
        </div>
      )}

      {/* 🎒 LIVING GARDEN INVENTORY DRAWER (TÚI CẢNH VẬT & KHO BÀY TRÍ) */}
      <AnimatePresence>
        {isInventoryOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-x-3 bottom-3 sm:inset-x-6 sm:bottom-4 z-40 bg-slate-950/95 backdrop-blur-2xl border-2 border-emerald-500/50 shadow-2xl rounded-3xl flex flex-col text-white pointer-events-auto select-none overflow-hidden max-h-[82%]"
          >
            {/* Drawer Header */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-800/90 flex items-center justify-between shrink-0 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Package size={17} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-amber-300">
                      {isVi ? 'Túi Cảnh Vật (Kho Bày Trí)' : 'Garden Storage (Inventory)'}
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                      {isVi ? `Đang bày: ${gardenEntities.length} món` : `Placed: ${gardenEntities.length} items`}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 hidden sm:block">
                    {isVi
                      ? 'Tự do lấy ra cắm vào vườn hoặc cất vào túi theo gu thẩm mỹ cá nhân'
                      : 'Freely place items into your garden or store them back into inventory'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 italic hidden md:inline">
                  {isVi ? 'Gợi ý: 15 - 25 món để vườn thoáng đẹp 60fps' : 'Tip: 15-25 items recommended for 60fps'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsInventoryOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
                  title={isVi ? 'Đóng túi đồ' : 'Close inventory'}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="px-4 py-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none bg-slate-900/30">
              {[
                { id: 'all', labelVi: 'Tất Cả Món', labelEn: 'All Items' },
                { id: 'architecture', labelVi: '🏛️ Kiến Trúc & Cảnh', labelEn: '🏛️ Pavilions & Decor' },
                { id: 'flora', labelVi: '🌸 Cây Cối & Hoa Cỏ', labelEn: '🌸 Trees & Flowers' },
                { id: 'fauna', labelVi: '🦋 Sinh Vật & Thú', labelEn: '🦋 Fauna & Spirits' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInventoryCategory(tab.id as any)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 border ${
                    inventoryCategory === tab.id
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {isVi ? tab.labelVi : tab.labelEn}
                </button>
              ))}
            </div>

            {/* Item Grid Catalog */}
            <div className="p-3 sm:p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[320px] scrollbar-thin scrollbar-thumb-slate-700">
              {Object.values(GARDEN_CATALOG)
                .filter((item, idx, arr) => {
                  if (item.type === 'tea_ceremony') return false;
                  if (arr.findIndex((x) => x.type === item.type) !== idx) return false;
                  if (inventoryCategory === 'all') return true;
                  return item.category === inventoryCategory;
                })
                .map((item) => {
                  const activeCount = gardenEntities.filter((e) => e.type === item.type).length;
                  const realmOverride = (biome?.id && REALM_ITEM_OVERRIDES[biome.id]?.[item.type]) || null;
                  const displayImg = realmOverride?.img || item.image;
                  const displayLabel = isVi
                    ? realmOverride?.labelVi || item.labelVi
                    : realmOverride?.labelEn || item.labelEn;
                  const displayIcon = realmOverride?.icon || item.icon;

                  return (
                    <div
                      key={item.type}
                      className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between group ${
                        activeCount > 0
                          ? 'bg-slate-900/90 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div>
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950/70 border border-slate-800 mb-2 flex items-center justify-center">
                          <img
                            src={displayImg}
                            alt={displayLabel}
                            className="max-w-[85%] max-h-[85%] object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          <span className="absolute top-1 left-1.5 text-xs">
                            {displayIcon}
                          </span>
                          {activeCount > 0 ? (
                            <span className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/90 text-slate-950 shadow-xs">
                              x{activeCount}
                            </span>
                          ) : (
                            <span className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-slate-800/80 text-slate-400">
                              {isVi ? 'Túi' : 'Bag'}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-[11px] font-bold text-slate-200 truncate" title={displayLabel}>
                            {displayLabel}
                          </h5>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {activeCount > 0
                              ? isVi ? `Đang bày ${activeCount} món` : `${activeCount} in garden`
                              : isVi ? 'Trong túi kho' : 'In storage'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onPlaceCatalogItem?.(item.type)}
                          className="flex-1 py-1 px-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                          title={isVi ? 'Bày thêm món này ra vườn' : 'Place into garden'}
                        >
                          <Plus size={11} />
                          <span>{isVi ? 'Bày ra' : 'Place'}</span>
                        </button>
                        {activeCount > 0 && (
                          <button
                            type="button"
                            onClick={() => onStoreCatalogItem?.(item.type)}
                            className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 font-black text-[10px] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                            title={isVi ? 'Thu hồi 1 món này cất vào túi' : 'Store back into bag'}
                          >
                            <Minus size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- MAIN ZEN BUILDER COMPONENT ---
interface ZenBuilderProps {
  deck: Deck;
  onExit: () => void;
}

export default function ZenBuilder({ deck, onExit }: ZenBuilderProps) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const rawCards = deck.cards.filter((c): c is FlashcardItem => c.type === 'flashcard');

  // SM-2 Spaced Repetition Due Filter
  const [onlyDueSM2, setOnlyDueSM2] = useState(false);

  const srsStats = useMemo(() => {
    const cardIds = rawCards.map((c) => c.id);
    return getDeckSRSStats(deck.id, cardIds);
  }, [deck.id, rawCards]);

  const cards = useMemo(() => {
    if (!onlyDueSM2) return rawCards.length > 0 ? rawCards : [];
    const records = getAllSM2Records();
    const now = new Date();
    const dueList = rawCards.filter((c) => {
      const key = `${deck.id}_${c.id}`;
      const rec = records[key];
      if (!rec || !rec.lastStudiedDate) return true; // new card is due
      return new Date(rec.nextReviewDate) <= now;
    });
    return dueList.length > 0 ? dueList : rawCards;
  }, [rawCards, onlyDueSM2, deck.id]);

  // Persistent Deck Progress (Đồng bộ tiến độ học của bộ thẻ trong Zen)
  const deckProgressKey = `zen_deck_progress_${deck.id}`;

  const [completedCardIds, setCompletedCardIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(deckProgressKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.completedCardIds)) {
          return parsed.completedCardIds;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(deckProgressKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed?.currentIndex === 'number' &&
          parsed.currentIndex >= 0 &&
          parsed.currentIndex < rawCards.length
        ) {
          return parsed.currentIndex;
        }
      }
    } catch {
      // ignore
    }
    return 0;
  });

  const [completedCount, setCompletedCount] = useState(() => completedCardIds.length);

  const saveDeckProgress = (newIndex: number, newCompletedIds: number[]) => {
    try {
      localStorage.setItem(
        deckProgressKey,
        JSON.stringify({
          currentIndex: newIndex,
          completedCardIds: newCompletedIds,
          lastUpdated: Date.now(),
        })
      );
    } catch {
      // ignore
    }
  };

  const handleGoPrev = () => {
    const nextIdx = Math.max(0, currentIndex - 1);
    setCurrentIndex(nextIdx);
    saveDeckProgress(nextIdx, completedCardIds);
  };

  const handleGoNext = () => {
    const nextIdx = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    saveDeckProgress(nextIdx, completedCardIds);
  };

  // Keyboard Shortcuts Modal State
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // 3-STEP LINEAR MASTERY FLOW:
  // 1 = 'contemplate' (Lật chiêm nghiệm)
  // 2 = 'bloom' (Tưới hoa nở)
  // 3 = 'stones' (Xếp sỏi chữ)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isFlipped, setIsFlipped] = useState(false);

  // Living Garden State (Cây, hoa, nhà, đàn cá nở rộ - lưu bền vững qua mọi phiên học & bộ thẻ)
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);
  const [gardenEntities, setGardenEntities] = useState<GardenEntity[]>(() => {
    try {
      const saved = localStorage.getItem('zen_garden_entities_v2');
      if (saved !== null) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // BẢO TOÀN TRẠNG THÁI RESET: Nếu người dùng đã bấm gieo lại/reset về [], giữ nguyên [] qua mọi lần F5/reload!
          if (parsed.length === 0) return [];

          // 🌹 MIGRATION TỰ ĐỘNG: Chuyển đổi dứt điểm tàn tích thảm ăn / tea_ceremony cũ sang Bụi Hồng Cổ Trang Nhỏ Xinh
          let hasMigration = false;
          parsed = parsed.map((item: any) => {
            if (
              item.type === 'tea_ceremony' ||
              (item.labelVi && (item.labelVi.includes('Chiếu') || item.labelVi.includes('thảm') || item.labelVi.includes('Thưởng Trà')))
            ) {
              hasMigration = true;
              const roseCatalog = GARDEN_CATALOG.chinese_rose;
              const roseSlot = HARMONIC_GARDEN_SLOTS.chinese_rose;
              return {
                ...item,
                type: 'chinese_rose',
                labelVi: roseCatalog.labelVi,
                labelEn: roseCatalog.labelEn,
                descVi: roseCatalog.descVi,
                descEn: roseCatalog.descEn,
                x: roseSlot.x,
                y: roseSlot.y,
                scale: roseSlot.scale,
              };
            }
            return item;
          });

          if (hasMigration) {
            try {
              localStorage.setItem('zen_garden_entities_v2', JSON.stringify(parsed));
            } catch {
              // ignore
            }
          }
          return parsed;
        }
      }

      // Nếu đã từng xác nhận reset vườn, tuyệt đối không tự động gieo lại
      const cleared = localStorage.getItem('zen_garden_cleared_v2');
      if (cleared === 'true') {
        return [];
      }

      // Khởi tạo tự động 1 lần duy nhất cho người dùng mới nâng cấp nếu đã có sẵn vốn từ vựng đã học trước đó
      const savedTotal = localStorage.getItem('zen_total_words_learned_v2');
      const count = savedTotal ? parseInt(savedTotal, 10) || 0 : 0;
      if (count > 0) {
        const initialCount = Math.min(count, 18);
        const seeded: GardenEntity[] = [];
        for (let i = 0; i < initialCount; i++) {
          seeded.push(generateGardenEntityByIndex(i));
        }
        try {
          localStorage.setItem('zen_garden_entities_v2', JSON.stringify(seeded));
        } catch {
          // ignore
        }
        return seeded;
      }
    } catch {
      // fallback
    }
    return [];
  });

  const handleResetGarden = () => {
    const msg = isVi
      ? 'Bạn có muốn làm mới và gieo lại cảnh vật khu vườn từ đầu không?\n(Khu vườn sẽ được làm sạch để đơm hoa kết trái từ các từ bạn tiếp tục học, số từ tích lũy và linh thú vẫn được bảo lưu!)'
      : 'Do you want to replant the garden landscape from scratch?\n(The garden will be cleared to bloom anew from your upcoming studies, while guardians and total stats remain intact!)';
    if (window.confirm(msg)) {
      setGardenEntities([]);
      try {
        localStorage.setItem('zen_garden_entities_v2', JSON.stringify([]));
        localStorage.setItem('zen_garden_cleared_v2', 'true');
      } catch {
        // ignore
      }
      playZenChime();
    }
  };

  const handleUpdateItemPosition = (id: string, x: number, y: number) => {
    setGardenEntities((prev) => {
      const updated = prev.map((el) => {
        if (el.id === id) {
          return { ...el, x, y, customPos: true };
        }
        return el;
      });
      try {
        localStorage.setItem('zen_garden_entities_v2', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleResetLayout = () => {
    const msg = isVi
      ? 'Bạn có muốn đặt lại toàn bộ vị trí các vật thể về bố cục phong thủy mặc định ban đầu không?'
      : 'Reset all objects back to their default harmonic positions?';
    if (window.confirm(msg)) {
      setGardenEntities((prev) => {
        const updated = prev.map((el, idx) => {
          const defaultSlot = HARMONIC_GARDEN_SLOTS[el.type];
          if (defaultSlot && idx < HARMONIC_UNLOCK_SEQUENCE.length) {
            return { ...el, x: defaultSlot.x, y: defaultSlot.y, customPos: false };
          }
          return { ...el, customPos: false };
        });
        try {
          localStorage.setItem('zen_garden_entities_v2', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      playZenChime();
    }
  };

  // 🎒 Túi Cảnh Vật: Bày thêm 1 món từ kho ra vườn theo gu cá nhân
  const handlePlaceCatalogItem = (type: GardenItemType) => {
    const catalog = GARDEN_CATALOG[type];
    if (!catalog) return;
    const defaultSlot = HARMONIC_GARDEN_SLOTS[type] || { x: 400, y: 300, scale: 1 };
    const countOfType = gardenEntities.filter((e) => e.type === type).length;
    const jitterX = countOfType > 0 ? ((countOfType * 37) % 110) - 55 : 0;
    const jitterY = countOfType > 0 ? ((countOfType * 23) % 70) - 35 : 0;

    const newEntity: GardenEntity = {
      id: `garden-placed-${Date.now()}-${type}`,
      type,
      x: Math.max(65, Math.min(735, defaultSlot.x + jitterX)),
      y: Math.max(120, Math.min(465, defaultSlot.y + jitterY)),
      scale: defaultSlot.scale || 1,
      labelVi: catalog.labelVi,
      labelEn: catalog.labelEn,
      descVi: catalog.descVi,
      descEn: catalog.descEn,
      createdAt: Date.now(),
      customPos: countOfType > 0,
    };

    setGardenEntities((prev) => {
      const next = [...prev, newEntity];
      try {
        localStorage.setItem('zen_garden_entities_v2', JSON.stringify(next));
        localStorage.removeItem('zen_garden_cleared_v2');
      } catch {
        // ignore
      }
      return next;
    });

    playZenTapSound();
    setLastGardenSpawned(isVi ? catalog.labelVi : catalog.labelEn);
    setTimeout(() => setLastGardenSpawned(null), 2500);
  };

  // 🎒 Túi Cảnh Vật: Cất 1 món cùng loại từ vườn vào kho túi
  const handleStoreCatalogItem = (type: GardenItemType) => {
    setGardenEntities((prev) => {
      const idx = [...prev].reverse().findIndex((e) => e.type === type);
      if (idx === -1) return prev;
      const actualIdx = prev.length - 1 - idx;
      const next = prev.filter((_, i) => i !== actualIdx);
      try {
        localStorage.setItem('zen_garden_entities_v2', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    playZenTapSound();
  };

  // 🎒 Cất 1 món cụ thể theo id (dùng cho modal inspect hoặc arrange mode)
  const handleRemoveItemById = (id: string) => {
    setGardenEntities((prev) => {
      const next = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem('zen_garden_entities_v2', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    playZenTapSound();
  };

  // 🗺️ Active Realm / Biome State (Cảnh Giới Cõi Gắn Liền Với 8 Thần Thú & Lưu Bền Vững)
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('zen_active_biome_id_v2');
      if (saved && BIOMES.some((b) => b.id === saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return BIOMES[0].id;
  });

  const [showRealmModal, setShowRealmModal] = useState(false);
  const [realmCelebration, setRealmCelebration] = useState<BiomeConfig | null>(null);

  // Set of unique normalized words learned across all decks (Chống tính trùng lặp từ vựng)
  const [uniqueLearnedWords, setUniqueLearnedWords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zen_unique_words_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((w: string) => String(w).trim().toLowerCase()).filter(Boolean);
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Cumulative Enlightened Vocabulary Words (Tổng từ vựng độc nhất đã giác ngộ qua mọi bộ thẻ)
  const [totalWordsLearned, setTotalWordsLearned] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('zen_total_words_learned_v2');
      const count = saved ? parseInt(saved, 10) || 0 : 0;
      return count;
    } catch {
      return 0;
    }
  });

  const currentBiomeIndex = useMemo(() => {
    const idx = BIOMES.findIndex((b) => b.id === selectedBiomeId);
    return idx >= 0 ? idx : 0;
  }, [selectedBiomeId]);

  const currentBiome = BIOMES[currentBiomeIndex]!;

  const handleSelectBiome = (biomeId: string) => {
    const target = BIOMES.find((b) => b.id === biomeId);
    if (!target) return;
    const effectiveWords = Math.max(totalWordsLearned, uniqueLearnedWords.length, completedCount);
    if (effectiveWords < target.requiredWords) return;

    setSelectedBiomeId(biomeId);
    try {
      localStorage.setItem('zen_active_biome_id_v2', biomeId);
    } catch {
      // ignore
    }
    playZenChime();
  };

  const [lastSM2Notification, setLastSM2Notification] = useState<{
    word: string;
    interval: number;
    isNew: boolean;
  } | null>(null);

  // Active Guardian Companion & Progressive Awakening (Khai Sáng Đánh Thức Thần Thú Tăng Tiến)
  const [unlockedGuardians, setUnlockedGuardians] = useState<MythicType[]>(() => {
    try {
      const saved = localStorage.getItem('zen_unlocked_guardians_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.includes('fairy_butterfly') ? parsed : ['fairy_butterfly', ...parsed];
        }
      }
    } catch {
      // fallback
    }
    return ['fairy_butterfly'];
  });

  const [activeGuardian, setActiveGuardian] = useState<MythicType>(() => {
    try {
      const saved = localStorage.getItem('zen_active_guardian_v2');
      if (saved && MYTHIC_POOL.includes(saved as MythicType)) {
        return saved as MythicType;
      }
    } catch {
      // fallback
    }
    return 'fairy_butterfly';
  });

  const [newlyUnlockedGuardian, setNewlyUnlockedGuardian] = useState<MythicAssetInfo | null>(null);

  const handleSelectGuardian = (type: MythicType) => {
    if (!unlockedGuardians.includes(type)) return;
    setActiveGuardian(type);
    try {
      localStorage.setItem('zen_active_guardian_v2', type);
    } catch {
      // ignore
    }
  };

  // Guardian Star Levels (1⭐ ➔ 5⭐: Mốc 3.000 ➔ 5.000 từ vựng)
  const [guardianStars, setGuardianStars] = useState<Record<MythicType, number>>(() => {
    try {
      const saved = localStorage.getItem('zen_guardian_stars_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return {
      fairy_butterfly: 1,
      celestial_lotus: 1,
      dragon_koi: 1,
      stag: 1,
      phoenix: 1,
      fox: 1,
      dragon: 1,
      world_tree: 1,
    };
  });

  const [ascendedCelebration, setAscendedCelebration] = useState<{
    asset: MythicAssetInfo;
    newStar: number;
    starConfig: StarTierConfig;
  } | null>(null);

  const handleAscendGuardianStar = (type: MythicType) => {
    const currentStar = guardianStars[type] || 1;
    if (currentStar >= 5) return;
    const nextStar = currentStar + 1;
    const nextConfig = GUARDIAN_STAR_TIERS.find((t) => t.stars === nextStar);
    if (!nextConfig) return;

    const effectiveWords = Math.max(totalWordsLearned, completedCount);
    if (effectiveWords < nextConfig.requiredWords) return;

    const updated = { ...guardianStars, [type]: nextStar };
    setGuardianStars(updated);
    try {
      localStorage.setItem('zen_guardian_stars_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }

    playZenChime();
    setAscendedCelebration({
      asset: MYTHIC_ASSETS[type],
      newStar: nextStar,
      starConfig: nextConfig,
    });
  };

  const [inspectingAsset, setInspectingAsset] = useState<MythicAssetInfo | null>(null);
  const [showFullscreenGuardian, setShowFullscreenGuardian] = useState(false);
  const [inspectingGardenItem, setInspectingGardenItem] = useState<GardenEntity | null>(null);
  const [showCodexModal, setShowCodexModal] = useState(false);
  const [lastSummonedLabel, setLastSummonedLabel] = useState<string | null>(null);
  const [lastGardenSpawned, setLastGardenSpawned] = useState<string | null>(null);

  // Sound Engine & Nature Mixer State
  const [soundChannels, setSoundChannels] = useState<SoundChannel[]>(DEFAULT_CHANNELS);
  const [isSoundActive, setIsSoundActive] = useState(false);
  const [masterVol, setMasterVol] = useState(0.85);
  const [showMixerModal, setShowMixerModal] = useState(false);

  // Step 2: Bloom state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [bloomStatus, setBloomStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Step 3: Stones state
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<{ id: string; char: string }[]>([]);

  // Level Up Banner
  const [showFlourishedBanner, setShowFlourishedBanner] = useState(false);

  const card = cards[currentIndex];

  // Initialize word state whenever index changes
  useEffect(() => {
    if (!card) return;
    const targetTerm = stripParentheses(card.front) || card.front;
    const cleanWord = targetTerm.replace(/\s+/g, '').toUpperCase();
    const chars = cleanWord.split('').map((c, i) => ({ id: `${c}-${i}`, char: c }));
    setAvailableLetters([...chars].sort(() => Math.random() - 0.5));
    setPlacedLetters([]);
    setSelectedOption(null);
    setBloomStatus('idle');
    setIsFlipped(false);
    // ALWAYS start at STEP 1: Lật chiêm nghiệm!
    setStep(1);
  }, [currentIndex, card]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      stopZenEngine();
    };
  }, []);

  // Fullscreen expand handler with native HTML5 Fullscreen API
  const handleToggleExpand = () => {
    if (!isCanvasExpanded) {
      setIsCanvasExpanded(true);
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {
        // Fallback to fixed full viewport
      }
    } else {
      setIsCanvasExpanded(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {
        // Ignore
      }
    }
  };

  // Escape key & fullscreen change listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (ascendedCelebration) {
          setAscendedCelebration(null);
          return;
        }
        if (newlyUnlockedGuardian) {
          setNewlyUnlockedGuardian(null);
          return;
        }
        if (showFullscreenGuardian) {
          setShowFullscreenGuardian(false);
          return;
        }
        if (inspectingAsset) {
          setInspectingAsset(null);
          return;
        }
        if (showCodexModal) {
          setShowCodexModal(false);
          return;
        }
        if (isCanvasExpanded) {
          setIsCanvasExpanded(false);
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        }
      }
    };

    const handleFsChange = () => {
      if (!document.fullscreenElement && isCanvasExpanded) {
        setIsCanvasExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [isCanvasExpanded, inspectingAsset, showFullscreenGuardian, showCodexModal, newlyUnlockedGuardian, ascendedCelebration]);

  // Sound toggles
  const handleToggleSoundMaster = () => {
    if (isSoundActive) {
      stopZenEngine();
      setIsSoundActive(false);
    } else {
      startZenEngine(soundChannels, masterVol);
      setIsSoundActive(true);
    }
  };

  const handleToggleChannel = (channelId: string) => {
    const updated = soundChannels.map((c) =>
      c.id === channelId ? { ...c, enabled: !c.enabled } : c
    );
    setSoundChannels(updated);
    if (isSoundActive) {
      applySoundChannels(updated);
    }
  };

  const handleChannelVolume = (channelId: string, vol: number) => {
    const updated = soundChannels.map((c) =>
      c.id === channelId ? { ...c, volume: vol } : c
    );
    setSoundChannels(updated);
    if (isSoundActive) {
      applySoundChannels(updated);
    }
  };

  const handleMasterVolumeChange = (vol: number) => {
    setMasterVol(vol);
    if (isSoundActive) {
      setMasterVolume(vol, soundChannels);
    }
  };

  const handleApplyPreset = (presetId: ZenPresetId) => {
    const updated = applyPresetToChannels(presetId, soundChannels);
    setSoundChannels(updated);
    if (isSoundActive) {
      applySoundChannels(updated);
    }
  };

  // Text-To-Speech Pronunciation
  const speakWord = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleaned = cleanTtsText(text);
    if (!cleaned) return;
    const utter = new SpeechSynthesisUtterance(cleaned);
    utter.lang = 'en-US';
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  };

  // Generate 4 Bloom Choices for Step 2
  const choices = useMemo(() => {
    if (!card) return [];
    const correctMeaning = card.back;
    const others = cards
      .filter((c) => c.id !== card.id && c.back !== correctMeaning)
      .map((c) => c.back);

    const fallbacks = isVi
      ? [
          'Giao tiếp an toàn, bảo mật thông tin',
          'Phát triển bền vững, thích nghi',
          'Hòa hợp tự nhiên, tâm an tịnh',
          'Sáng tạo đổi mới, nâng tầm hiểu biết',
        ]
      : [
          'Secure communication, protected data',
          'Sustainable growth, natural adaptation',
          'Harmony with nature, tranquil peace',
          'Creative innovation, expanded insight',
        ];
    const candidates = [...others, ...fallbacks];
    const distractors: string[] = [];

    while (distractors.length < 3 && candidates.length > 0) {
      const idx = Math.floor(Math.random() * candidates.length);
      const chosen = candidates[idx]!;
      if (!distractors.includes(chosen) && chosen !== correctMeaning) {
        distractors.push(chosen);
      }
      candidates.splice(idx, 1);
    }

    return [correctMeaning, ...distractors].sort(() => Math.random() - 0.5);
  }, [card, cards, isVi]);

  // 🌸 Spawn a New Living Garden Element (Hoa nở, khóm trúc, nhà tranh, cá koi - lưu vĩnh viễn)
  const spawnGardenElement = () => {
    const count = gardenEntities.length;
    const newEntity = generateGardenEntityByIndex(count);
    const catalogInfo = GARDEN_CATALOG[newEntity.type];

    setGardenEntities((prev) => {
      const next = [...prev, newEntity];
      try {
        localStorage.setItem('zen_garden_entities_v2', JSON.stringify(next));
        localStorage.removeItem('zen_garden_cleared_v2');
      } catch {
        // ignore
      }
      return next;
    });

    setLastGardenSpawned(isVi ? (newEntity.labelVi || catalogInfo.labelVi) : (newEntity.labelEn || catalogInfo.labelEn));
    setTimeout(() => setLastGardenSpawned(null), 3500);
  };

  // STEP 2: Bloom Option Selected
  const handleBloomSelect = (choice: string) => {
    if (bloomStatus === 'correct') return;
    setSelectedOption(choice);

    if (choice === card.back) {
      setBloomStatus('correct');
      playZenChime();

      // 🌱 Water flower into the garden!
      spawnGardenElement();

      // Seamlessly advance to STEP 3: Xếp sỏi chữ!
      setTimeout(() => {
        setStep(3);
      }, 900);
    } else {
      setBloomStatus('wrong');
      setTimeout(() => {
        setBloomStatus('idle');
        setSelectedOption(null);
      }, 1000);
    }
  };

  // STEP 3: Letter Stone Tapped
  const handleStoneTap = (item: { id: string; char: string }) => {
    playZenTapSound();
    const nextPlaced = [...placedLetters, item.char];
    setPlacedLetters(nextPlaced);
    setAvailableLetters((prev) => prev.filter((it) => it.id !== item.id));

    const targetWord = (stripParentheses(card.front) || card.front).replace(/\s+/g, '').toUpperCase();
    if (nextPlaced.length === targetWord.length) {
      if (nextPlaced.join('') === targetWord) {
        // GRAND VICTORY: Manifest living element & move to next card!
        playZenChime();
        spawnGardenElement();

        const newCount = completedCount + 1;
        setCompletedCount(newCount);

        // 🧠 XỬ LÝ CHỐNG TRÙNG LẶP TỪ VỰNG (Unique Words Deduplication)
        const rawWord = card.front.trim();
        const normalizedTerm = rawWord.toLowerCase();
        const isAlreadyLearned = uniqueLearnedWords.includes(normalizedTerm);

        let newUniqueList = uniqueLearnedWords;
        let newTotal = totalWordsLearned;

        if (!isAlreadyLearned) {
          newUniqueList = [...uniqueLearnedWords, normalizedTerm];
          setUniqueLearnedWords(newUniqueList);
          newTotal = Math.max(totalWordsLearned + 1, newUniqueList.length);
          setTotalWordsLearned(newTotal);
          try {
            localStorage.setItem('zen_unique_words_v2', JSON.stringify(newUniqueList));
            localStorage.setItem('zen_total_words_learned_v2', newTotal.toString());
          } catch {
            // ignore
          }
        }

        // 🧠 TÍCH HỢP ĐỒNG BỘ THUẬT TOÁN SM-2 (Spaced Repetition System)
        try {
          const currentSM2 = getCardSM2Record(card.id, deck.id);
          // Hoàn thành đúc chữ trong Zen = phản xạ Tốt (Rating 3)
          const updatedSM2 = calculateSM2(currentSM2, 3);
          saveSM2Record(updatedSM2);
          setLastSM2Notification({
            word: rawWord,
            interval: updatedSM2.interval,
            isNew: !isAlreadyLearned,
          });
          setTimeout(() => setLastSM2Notification(null), 3800);
        } catch (e) {
          console.error('Error saving SM-2 in ZenBuilder:', e);
        }

        // Effective progress count for awakening: highest of lifetime unique total or current session count
        const effectiveWords = Math.max(newTotal, newUniqueList.length, newCount);

        // Check progressive awakening for Divine Beasts (Mỗi 3 từ vựng đánh thức 1 Thần Thú)
        const newlyAwakened: MythicType[] = [];
        MYTHIC_POOL.forEach((bType) => {
          const req = GUARDIAN_UNLOCK_MILESTONES[bType];
          if (effectiveWords >= req && !unlockedGuardians.includes(bType) && !newlyAwakened.includes(bType)) {
            newlyAwakened.push(bType);
          }
        });

        if (newlyAwakened.length > 0) {
          const updatedUnlocked = [...unlockedGuardians, ...newlyAwakened];
          setUnlockedGuardians(updatedUnlocked);
          try {
            localStorage.setItem('zen_unlocked_guardians_v2', JSON.stringify(updatedUnlocked));
          } catch {
            // ignore
          }
          const latestBeast = newlyAwakened[newlyAwakened.length - 1]!;
          setNewlyUnlockedGuardian(MYTHIC_ASSETS[latestBeast]);

          // Tự động khai mở & chuyển tới Cõi mới tương ứng với Thần Thú vừa thức tỉnh!
          const matchingBiome = BIOMES.find((b) => b.guardianType === latestBeast);
          if (matchingBiome) {
            setSelectedBiomeId(matchingBiome.id);
            try {
              localStorage.setItem('zen_active_biome_id_v2', matchingBiome.id);
            } catch {
              // ignore
            }
          }
          playZenChime();
        }

        if (newCount > 0 && newCount % 5 === 0) {
          setShowFlourishedBanner(true);
          setTimeout(() => setShowFlourishedBanner(false), 3600);

          studyApi
            .submitSession({
              deckId: deck.id,
              mode: 'zen',
              cardsStudied: newCount,
              correctCount: newCount,
              timeSpentSeconds: 90,
            })
            .catch(console.error);
        }

        // Advance to next card smoothly & persist deck progress
        setTimeout(() => {
          const nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
          setCurrentIndex(nextIndex);
          const updatedCompleted = completedCardIds.includes(card.id)
            ? completedCardIds
            : [...completedCardIds, card.id];
          setCompletedCardIds(updatedCompleted);
          saveDeckProgress(nextIndex, updatedCompleted);
        }, 1400);
      } else {
        setTimeout(() => {
          const targetTerm = stripParentheses(card.front) || card.front;
          const cleanWord = targetTerm.replace(/\s+/g, '').toUpperCase();
          const chars = cleanWord.split('').map((c, i) => ({ id: `${c}-${i}`, char: c }));
          setAvailableLetters([...chars].sort(() => Math.random() - 0.5));
          setPlacedLetters([]);
        }, 850);
      }
    }
  };

  const handleUndoStone = (index: number) => {
    if (!card) return;
    const targetWord = (stripParentheses(card.front) || card.front).replace(/\s+/g, '').toUpperCase();
    if (placedLetters.length === targetWord.length && placedLetters.join('') === targetWord) return;
    const char = placedLetters[index];
    if (!char) return;
    playZenTapSound();
    setPlacedLetters((prev) => prev.filter((_, i) => i !== index));
    setAvailableLetters((prev) => [...prev, { id: `${char}-${Date.now()}-${Math.random()}`, char }]);
  };

  const handleHintStone = () => {
    if (!card) return;
    const targetWord = (stripParentheses(card.front) || card.front).replace(/\s+/g, '').toUpperCase();
    const nextIdx = placedLetters.length;
    if (nextIdx >= targetWord.length) return;
    const needed = targetWord[nextIdx];
    const match = availableLetters.find((it) => it.char === needed);
    if (match) handleStoneTap(match);
  };

  // UNIFIED ZEN FLOW KEYBOARD SHORTCUTS (Hybrid Chuột + Bàn phím cho Bước 1, 2, 3)
  useEffect(() => {
    const handleZenKeyDown = (e: KeyboardEvent) => {
      // Không can thiệp nếu đang nhập trong ô input, textarea hoặc select
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Check overlay / modal chiêm ngưỡng đang mở (ngoại trừ shortcuts modal)
      if (
        showMixerModal ||
        showCodexModal ||
        inspectingAsset ||
        ascendedCelebration ||
        newlyUnlockedGuardian ||
        showFullscreenGuardian ||
        showRealmModal ||
        inspectingGardenItem
      ) {
        return;
      }

      // 0. Bật / tắt Bảng Phím tắt bằng phím '?' (Shift + /)
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // Đóng bảng phím tắt bằng Escape
      if (showShortcutsModal) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowShortcutsModal(false);
        }
        return;
      }

      // Bỏ qua phím hệ thống cho hành động game
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // ==========================================
      // BƯỚC 1: LẬT CHIÊM NGHIỆM (CONTEMPLATE)
      // ==========================================
      if (step === 1) {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
          playZenTapSound();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          setStep(2);
          playZenTapSound();
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleGoPrev();
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleGoNext();
          return;
        }
      }

      // ==========================================
      // BƯỚC 2: TƯỚI HOA NGỘ ĐẠO (BLOOM QUIZ)
      // ==========================================
      if (step === 2 && bloomStatus === 'idle') {
        let num: number | null = null;
        if (e.code.startsWith('Digit')) {
          num = parseInt(e.code.replace('Digit', ''), 10);
        } else if (e.code.startsWith('Numpad')) {
          num = parseInt(e.code.replace('Numpad', ''), 10);
        } else if (['1', '2', '3', '4'].includes(e.key)) {
          num = parseInt(e.key, 10);
        }

        if (num !== null && num >= 1 && num <= 4) {
          const choice = choices[num - 1];
          if (choice) {
            e.preventDefault();
            handleBloomSelect(choice);
            return;
          }
        }

        if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
          e.preventDefault();
          setStep(1);
          playZenTapSound();
          return;
        }
      }

      // ==========================================
      // BƯỚC 3: XẾP SỎI CHỮ (STONE SPELL)
      // ==========================================
      if (step === 3 && card) {
        const targetWord = (stripParentheses(card.front) || card.front).replace(/\s+/g, '').toUpperCase();

        if (e.key === 'Backspace' || e.key === 'Delete') {
          if (placedLetters.length > 0 && placedLetters.join('') !== targetWord) {
            e.preventDefault();
            handleUndoStone(placedLetters.length - 1);
          }
          return;
        }

        if (e.key === 'ArrowLeft' && placedLetters.length === 0) {
          e.preventDefault();
          setStep(2);
          playZenTapSound();
          return;
        }

        if (e.key.length === 1) {
          if (placedLetters.length >= targetWord.length) return;

          const pressedChar = e.key.toUpperCase();
          const match = availableLetters.find((it) => it.char.toUpperCase() === pressedChar);
          if (match) {
            e.preventDefault();
            handleStoneTap(match);
          }
        }
      }
    };

    window.addEventListener('keydown', handleZenKeyDown);
    return () => {
      window.removeEventListener('keydown', handleZenKeyDown);
    };
  }, [
    step,
    card,
    choices,
    bloomStatus,
    placedLetters,
    availableLetters,
    showShortcutsModal,
    showMixerModal,
    showCodexModal,
    inspectingAsset,
    ascendedCelebration,
    newlyUnlockedGuardian,
    showFullscreenGuardian,
    showRealmModal,
    inspectingGardenItem,
    completedCardIds,
    currentIndex,
    cards.length,
  ]);

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-emerald-50 text-center">
        <p className="text-slate-500">{t('zen_deck_empty_desc')}</p>
      </div>
    );
  }

  const currentGuardianAsset = MYTHIC_ASSETS[activeGuardian] || MYTHIC_ASSETS.dragon;

  return (
    <div
      className="min-h-screen flex flex-col select-none transition-colors duration-700 bg-gradient-to-b from-emerald-50/70 via-teal-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/90 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <X size={15} /> <span>{isVi ? 'Rời Ốc Đảo' : 'Exit Sanctuary'}</span>
          </button>

          {/* Title & Biome Indicator */}
          <button
            onClick={() => setShowRealmModal(true)}
            className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity cursor-pointer group"
            title={isVi ? 'Bản Đồ Cảnh Giới' : 'Realms Map'}
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Compass size={15} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                {t('zen_title')}
              </h1>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                <span>{isVi ? `Cõi ${currentBiomeIndex + 1}: ${currentBiome.nameVi}` : `Realm ${currentBiomeIndex + 1}: ${currentBiome.nameEn}`}</span>
                <span className="text-amber-500">✦</span>
              </p>
            </div>
          </button>

          {/* Right Header Buttons */}
          <div className="flex items-center gap-2">
            {/* Realm Selector Button (Cảnh Giới Cõi) */}
            <button
              onClick={() => setShowRealmModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm hover:from-teal-700 hover:to-emerald-700 transition-all cursor-pointer"
              title={isVi ? 'Bản Đồ Cảnh Giới Cõi' : 'Realms Map'}
            >
              <Compass size={13} />
              <span className="hidden sm:inline">{isVi ? 'Cảnh Giới' : 'Realms'}</span>
            </button>

            {/* Mythic Codex Button (Liên Quân Beasts) */}
            <button
              onClick={() => setShowCodexModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm hover:from-amber-600 hover:to-amber-700 transition-all cursor-pointer"
            >
              <Shield size={13} />
              <span className="hidden sm:inline">{t('zen_btn_codex')}</span>
            </button>

            {/* Sound Mixer Toggle Button */}
            <button
              onClick={() => setShowMixerModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSoundActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {isSoundActive ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
              <span className="hidden sm:inline">{t('zen_btn_sound_mixer')}</span>
            </button>

            {/* Keyboard Shortcuts Button */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700"
              title={isVi ? 'Phím tắt bàn phím (?)' : 'Keyboard shortcuts (?)'}
            >
              <Keyboard size={14} />
              <span className="hidden md:inline">{isVi ? 'Phím tắt' : 'Shortcuts'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Garden Item Lore Detail Modal */}
      <AnimatePresence>
        {inspectingGardenItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center relative"
            >
              <button
                onClick={() => setInspectingGardenItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>

              {(() => {
                const activeOverride = selectedBiomeId ? REALM_ITEM_OVERRIDES[selectedBiomeId]?.[inspectingGardenItem.type] : undefined;
                const displayLabel = (isVi ? activeOverride?.labelVi : activeOverride?.labelEn) || (isVi ? inspectingGardenItem.labelVi : inspectingGardenItem.labelEn);
                const displayDesc = (isVi ? activeOverride?.descVi : activeOverride?.descEn) || (isVi ? inspectingGardenItem.descVi : inspectingGardenItem.descEn);
                const displayImg = activeOverride?.img || GARDEN_CATALOG[inspectingGardenItem.type]?.image;
                const displayIcon = activeOverride?.icon || GARDEN_CATALOG[inspectingGardenItem.type]?.icon || '🌸';

                return (
                  <>
                    <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-inner border border-emerald-300/40 p-2 overflow-hidden">
                      {displayImg ? (
                        <img
                          src={displayImg}
                          alt={displayLabel}
                          className="w-full h-full object-contain filter drop-shadow-md"
                        />
                      ) : (
                        <span className="text-3xl">{displayIcon}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">
                        {t('zen_item_modal_title')}
                      </span>
                      <h3 className="font-black text-lg text-slate-900 dark:text-white">
                        {displayLabel}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {displayDesc}
                    </p>
                  </>
                );
              })()}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (inspectingGardenItem) {
                      handleRemoveItemById(inspectingGardenItem.id);
                      setInspectingGardenItem(null);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  title={isVi ? 'Thu hồi vật thể này cất vào túi cảnh vật' : 'Store this item into inventory'}
                >
                  <Package size={14} />
                  <span>{isVi ? 'Cất Vào Túi' : 'Store to Bag'}</span>
                </button>
                <button
                  onClick={() => setInspectingGardenItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
                >
                  {t('zen_item_modal_close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌟 DIALOG CHÚC MỪNG ĐỘT PHÁ SAO CẢNH GIỚI (Star Ascension Celebration Modal) */}
      <AnimatePresence>
        {ascendedCelebration && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl"
            onClick={() => setAscendedCelebration(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 max-w-md w-full shadow-[0_0_60px_rgba(251,191,36,0.45)] text-white text-center space-y-4 overflow-hidden"
            >
              {/* Dynamic Aura Background Glow */}
              <div
                className="absolute -top-24 -left-24 w-52 h-52 rounded-full blur-3xl opacity-40 pointer-events-none"
                style={{ background: ascendedCelebration.starConfig.auraColor }}
              />
              <div
                className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full blur-3xl opacity-40 pointer-events-none"
                style={{ background: ascendedCelebration.starConfig.auraColor }}
              />

              <button
                onClick={() => setAscendedCelebration(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer z-20"
              >
                <X size={18} />
              </button>

              {/* Top Title Badge */}
              <div className="flex flex-col items-center gap-1.5 pt-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring' }}
                  className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm"
                >
                  <Sparkles size={14} className="text-amber-400 animate-spin" />
                  <span>{isVi ? 'ĐỘT PHÁ CẢNH GIỚI THÀNH CÔNG!' : 'STAR ASCENSION COMPLETE!'}</span>
                  <Sparkles size={14} className="text-amber-400 animate-spin" />
                </motion.div>
                <p className="text-xs text-amber-200 font-bold">
                  {isVi ? ascendedCelebration.starConfig.nameVi : ascendedCelebration.starConfig.nameEn}
                </p>
              </div>

              {/* Star Rating Display */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, type: 'spring' }}
                className="flex items-center justify-center gap-1.5 py-1"
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={s <= ascendedCelebration.newStar ? 24 : 18}
                    className={
                      s <= ascendedCelebration.newStar
                        ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                        : 'text-slate-700'
                    }
                  />
                ))}
              </motion.div>

              {/* Beast Visual with Aura Ring */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl"
                style={{
                  boxShadow: `0 0 35px ${ascendedCelebration.starConfig.auraColor}60`,
                }}
              >
                <img
                  src={ascendedCelebration.asset.imageHd || ascendedCelebration.asset.image}
                  alt={isVi ? ascendedCelebration.asset.labelVi : ascendedCelebration.asset.labelEn}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Realm Name & Description */}
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-amber-300">
                  {isVi ? ascendedCelebration.asset.labelVi : ascendedCelebration.asset.labelEn}
                </h3>
                <div className="inline-block px-3 py-0.5 rounded-full bg-slate-800 border border-amber-400/40 text-amber-300 text-xs font-black">
                  ✦ {isVi ? ascendedCelebration.starConfig.titleVi : ascendedCelebration.starConfig.titleEn}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium px-2">
                  {isVi ? ascendedCelebration.starConfig.bonusDescVi : ascendedCelebration.starConfig.bonusDescEn}
                </p>
                {ascendedCelebration.newStar === 5 && (
                  <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-bold leading-relaxed mt-2">
                    👑 {isVi
                      ? 'Đại Sư 5.000 Từ Vựng: Bạn đã đạt đỉnh cao giao tiếp tiếng Anh tự tin, trôi chảy tuyệt đối!'
                      : '5,000 Words Grandmaster: You have reached absolute English conversational mastery!'}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => setAscendedCelebration(null)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>{isVi ? 'Chiêm Ngưỡng Hào Quang ✨' : 'Embrace The Aura ✨'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌟 DIALOG CHÚC MỪNG THẦN THÚ THỨC TỈNH (Gacha Awakening Celebration Modal) */}
      <AnimatePresence>
        {newlyUnlockedGuardian && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl"
            onClick={() => setNewlyUnlockedGuardian(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(251,191,36,0.35)] text-white text-center space-y-4 overflow-hidden"
            >
              {/* Radiant background burst */}
              <div
                className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
                style={{ background: newlyUnlockedGuardian.glowColor }}
              />
              <div
                className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
                style={{ background: newlyUnlockedGuardian.glowColor }}
              />

              <button
                onClick={() => setNewlyUnlockedGuardian(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer z-20"
              >
                <X size={18} />
              </button>

              {/* Top Header Badge */}
              <div className="flex flex-col items-center gap-1.5 pt-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring' }}
                  className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm"
                >
                  <Sparkles size={14} className="text-amber-400 animate-spin" />
                  <span>{isVi ? 'Thần Thú Đã Thức Tỉnh!' : 'Divine Guardian Awakened!'}</span>
                  <Sparkles size={14} className="text-amber-400 animate-spin" />
                </motion.div>
                <p className="text-[11px] text-slate-400">
                  {isVi
                    ? `Khai sáng thành công ${Math.max(totalWordsLearned, completedCount)} từ vựng`
                    : `Enlightened ${Math.max(totalWordsLearned, completedCount)} vocabulary words`}
                </p>
              </div>

              {/* Beast Artwork */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-3xl overflow-hidden border-2 border-amber-400/80 shadow-2xl group"
                style={{
                  boxShadow: `0 0 35px ${newlyUnlockedGuardian.glowColor}50`,
                }}
              >
                <img
                  src={newlyUnlockedGuardian.imageHd || newlyUnlockedGuardian.image}
                  alt={isVi ? newlyUnlockedGuardian.labelVi : newlyUnlockedGuardian.labelEn}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md bg-gradient-to-r ${newlyUnlockedGuardian.tierColor} text-slate-950 shadow-md`}
                  >
                    {newlyUnlockedGuardian.tier}
                  </span>
                </div>
              </motion.div>

              {/* Beast Info */}
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-amber-300">
                  {isVi ? newlyUnlockedGuardian.labelVi : newlyUnlockedGuardian.labelEn}
                </h3>
                <p className="text-xs text-amber-200/80 font-bold">
                  {isVi ? newlyUnlockedGuardian.titleVi : newlyUnlockedGuardian.titleEn} • {isVi ? newlyUnlockedGuardian.elementVi : newlyUnlockedGuardian.elementEn}
                </p>
                <p className="text-xs text-slate-300 font-medium line-clamp-3 pt-1 px-2">
                  {isVi ? newlyUnlockedGuardian.descVi : newlyUnlockedGuardian.descEn}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    handleSelectGuardian(newlyUnlockedGuardian.type);
                    setLastSummonedLabel(isVi ? newlyUnlockedGuardian.labelVi : newlyUnlockedGuardian.labelEn);
                    setTimeout(() => setLastSummonedLabel(null), 4000);
                    setNewlyUnlockedGuardian(null);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-xl hover:shadow-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={16} />
                  <span>{isVi ? 'Đồng Hành Ngay ✨' : 'Equip as Companion ✨'}</span>
                </button>
                <button
                  onClick={() => setNewlyUnlockedGuardian(null)}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  {isVi ? 'Để Sau' : 'Later'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Keyboard size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-800 dark:text-white">
                      {isVi ? 'Phím tắt bàn phím Zen' : 'Zen Keyboard Shortcuts'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {isVi ? 'Học tập liền mạch 100% bằng bàn phím' : 'Seamless full-keyboard study flow'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Step 1 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1.5">
                    1. {t('zen_step_1_title')}
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Lật thẻ chiêm nghiệm' : 'Flip flashcard'}</span>
                      <div className="flex items-center gap-1 font-mono">
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] shadow-2xs">Space</kbd>
                        <span className="text-slate-400">/</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] shadow-2xs">↑</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] shadow-2xs">↓</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Bắt đầu tưới hoa' : 'Begin watering'}</span>
                      <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] font-mono shadow-2xs">Enter</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Chuyển từ trước / sau' : 'Prev / Next card'}</span>
                      <div className="flex items-center gap-1 font-mono">
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] shadow-2xs">←</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] shadow-2xs">→</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1.5">
                    2. {t('zen_step_2_title')}
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Chọn 1 trong 4 đáp án' : 'Choose 1 of 4 choices'}</span>
                      <div className="flex items-center gap-1 font-mono">
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] shadow-2xs">1</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] shadow-2xs">2</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] shadow-2xs">3</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] shadow-2xs">4</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Quay lại xem thẻ' : 'Back to card review'}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] font-mono shadow-2xs">Backspace</kbd>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1.5">
                    3. {t('zen_step_3_title')}
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Gõ sỏi chữ cái trực tiếp' : 'Type letter pebbles'}</span>
                      <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] font-mono shadow-2xs">A - Z</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Thu hồi sỏi vừa đặt' : 'Undo last placed pebble'}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] font-mono shadow-2xs">Backspace</kbd>
                    </div>
                  </div>
                </div>

                {/* General */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{isVi ? 'Bật / tắt nhanh bảng phím tắt này' : 'Toggle shortcuts cheat sheet'}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono text-[10px] shadow-2xs">?</kbd>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mythic Beasts Codex / Gallery Modal (Bảng Phong Thần - Khai Sáng Đánh Thức Thần Thú) */}
      <AnimatePresence>
        {showCodexModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                    <Award size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-amber-300">
                      {t('zen_codex_title')}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {t('zen_codex_subtitle')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCodexModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Awakening Progress Bar */}
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-300 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" />
                    <span>{isVi ? 'Tiến Độ Đánh Thức Thần Thú:' : 'Awakening Progress:'}</span>
                  </span>
                  <span className="text-emerald-400 font-black">
                    {unlockedGuardians.length} / {MYTHIC_POOL.length} {isVi ? 'Thần Thú' : 'Beasts'}
                    <span className="text-slate-400 font-normal text-[11px] ml-1.5">
                      ({Math.max(totalWordsLearned, completedCount)} {isVi ? 'từ đã giác ngộ' : 'words'})
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${(unlockedGuardians.length / MYTHIC_POOL.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Grid of 8 Mythic Beasts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto pr-1 flex-1 py-1">
                {MYTHIC_POOL.map((mType) => {
                  const asset = MYTHIC_ASSETS[mType];
                  const isUnlocked = unlockedGuardians.includes(mType);
                  const isActive = activeGuardian === mType;
                  const reqWords = GUARDIAN_UNLOCK_MILESTONES[mType];
                  const effectiveWords = Math.max(totalWordsLearned, completedCount);
                  const remainingWords = Math.max(0, reqWords - effectiveWords);

                  return (
                    <div
                      key={mType}
                      className={`relative rounded-2xl overflow-hidden p-2.5 flex flex-col items-center text-center transition-all border cursor-pointer ${
                        !isUnlocked
                          ? 'border-slate-800 bg-slate-900/90 opacity-80 hover:opacity-100 hover:border-slate-700'
                          : isActive
                          ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/20'
                          : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                      }`}
                      onClick={() => {
                        setInspectingAsset(asset);
                      }}
                    >
                      <span
                        className={`absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                          isUnlocked
                            ? `bg-gradient-to-r ${asset.tierColor} text-slate-950`
                            : 'bg-slate-700 text-slate-400'
                        } shadow-sm z-10`}
                      >
                        {asset.tier}
                      </span>

                      {/* Status badge top right */}
                      <div className="absolute top-2 right-2 z-10">
                        {isUnlocked ? (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/25 border border-amber-400/50 text-amber-300 flex items-center gap-0.5 shadow-sm">
                            <Star size={9} className="fill-amber-400 text-amber-400" />
                            <span>{guardianStars[mType] || 1}</span>
                          </span>
                        ) : (
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-slate-400 flex items-center gap-0.5">
                            <Lock size={9} />
                            <span>{reqWords} {isVi ? 'từ' : 'words'}</span>
                          </span>
                        )}
                      </div>

                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-400/50 my-2 shadow-inner group">
                        <img
                          src={asset.image}
                          alt={isVi ? asset.labelVi : asset.labelEn}
                          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                            !isUnlocked ? 'filter grayscale brightness-[0.28] contrast-125' : ''
                          }`}
                          loading="lazy"
                          decoding="async"
                        />
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[1px] p-1.5">
                            <div className="w-6 h-6 rounded-full bg-slate-900/90 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md">
                              <Lock size={12} />
                            </div>
                            <span className="text-[9px] font-bold text-amber-200 mt-1 drop-shadow-sm px-1 text-center">
                              {remainingWords <= 10
                                ? (isVi ? `Chỉ còn ${remainingWords} từ!` : `${remainingWords} left!`)
                                : `${effectiveWords}/${reqWords} ${isVi ? 'từ' : 'words'}`}
                            </span>
                            <div className="w-14 h-1 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round((effectiveWords / reqWords) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <h4 className="font-extrabold text-xs text-amber-200 line-clamp-1">
                        {isVi ? asset.labelVi : asset.labelEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {isVi ? asset.elementVi : asset.elementEn}
                      </p>

                      {isUnlocked && (
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={10}
                              className={
                                s <= (guardianStars[mType] || 1)
                                  ? 'text-amber-400 fill-amber-400 filter drop-shadow'
                                  : 'text-slate-700'
                              }
                            />
                          ))}
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-1 w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isUnlocked) {
                              handleSelectGuardian(asset.type);
                              setLastSummonedLabel(isVi ? asset.labelVi : asset.labelEn);
                              setTimeout(() => setLastSummonedLabel(null), 4000);
                            } else {
                              setInspectingAsset(asset);
                            }
                          }}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
                            !isUnlocked
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                              : isActive
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                        >
                          {!isUnlocked
                            ? (isVi ? `🔒 Cần ${reqWords} từ` : `🔒 ${reqWords} words`)
                            : isActive
                            ? (isVi ? 'Đang Chọn' : 'Selected')
                            : (isVi ? 'Đồng Hành' : 'Companion')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] leading-tight">
                  {isVi
                    ? '3.000 từ cốt lõi mở 8 Thần Thú • Đột phá 5⭐ (5.000 từ) đạt Cửu Thiên Chí Tôn!'
                    : '3,000 core words awaken 8 Guardians • 5⭐ Ascension (5,000 words) for Celestial Mastery!'}
                </span>
                <button
                  onClick={() => setShowCodexModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer shrink-0 ml-2"
                >
                  {isVi ? 'Đóng' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🗺️ BẢNG CHỌN CẢNH GIỚI CÕI (REALMS SELECTOR MODAL) */}
      <AnimatePresence>
        {showRealmModal && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowRealmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-4 sm:p-5 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-inner shrink-0">
                    <Compass size={20} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-emerald-300">
                      {isVi ? 'Bản Đồ Cảnh Giới Cõi' : 'Sanctuary Realms Map'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isVi
                        ? '8 Cõi thiên nhiên gắn liền với 8 Thần Thú cổ đại • Tự do chọn Cõi & Linh Thú đi cùng'
                        : '8 Nature Realms paired with 8 Divine Guardians • Freely choose your realm & companion'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRealmModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* VÙNG CUỘN CHÍNH (Bọc cả Banner và Grid 8 Cõi với scrollbar mượt mà, thấy trọn vẹn 100% Cõi 7 và Cõi 8) */}
              <div
                className="flex-1 min-h-0 overflow-y-auto pr-1.5 sm:pr-2.5 my-2 space-y-3.5 overscroll-contain"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#10b981 #1e293b',
                }}
              >
                {/* Current Active Realm & Companion Spotlight Banner */}
                <div
                  className="p-3 sm:p-3.5 rounded-2xl border border-white/20 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0"
                  style={{ background: currentBiome.skyGradient }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/90 text-slate-950 shadow-sm">
                        {isVi ? 'ĐANG NGỰ TRỊ' : 'ACTIVE REALM'}
                      </span>
                      <span className="text-xs font-bold text-white/90 drop-shadow">
                        {isVi ? currentBiome.realmTitleVi : currentBiome.realmTitleEn}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-white drop-shadow-md">
                      {isVi ? currentBiome.nameVi : currentBiome.nameEn}
                    </h4>
                    <p className="text-xs text-white/85 max-w-xl line-clamp-1 mt-0.5 drop-shadow font-medium">
                      {isVi ? currentBiome.ambientNoteVi : currentBiome.ambientNoteEn}
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center gap-2 shrink-0">
                    {/* Current Equipped Companion Badge */}
                    <div className="flex items-center gap-2 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-400/50 shadow-md">
                      <img
                        src={currentGuardianAsset.image}
                        alt={isVi ? currentGuardianAsset.labelVi : currentGuardianAsset.labelEn}
                        className="w-8 h-8 rounded-full object-cover border border-amber-400 shrink-0"
                      />
                      <div className="text-left">
                        <p className="text-[9px] text-amber-300 font-extrabold uppercase">
                          {isVi ? 'Linh Thú Đi Cùng' : 'Current Companion'}
                        </p>
                        <p className="text-xs font-black text-white truncate max-w-[110px]">
                          {isVi ? currentGuardianAsset.labelVi : currentGuardianAsset.labelEn}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Realms Grid (8 Cõi - Có khoảng đệm pb-10 ở cuối đảm bảo hiển thị 100% Cõi 7 và Cõi 8) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-10">
                  {BIOMES.map((b) => {
                    const beast = MYTHIC_ASSETS[b.guardianType];
                    const effectiveWords = Math.max(totalWordsLearned, uniqueLearnedWords.length, completedCount);
                    const isUnlocked = effectiveWords >= b.requiredWords || unlockedGuardians.includes(b.guardianType);
                    const isBeastUnlocked = unlockedGuardians.includes(b.guardianType);
                    const isActiveBiome = selectedBiomeId === b.id;
                    const isEquippedBeast = activeGuardian === b.guardianType;
                    const remaining = Math.max(0, b.requiredWords - effectiveWords);

                    return (
                      <div
                        key={b.id}
                        className={`relative rounded-2xl overflow-hidden border transition-all flex flex-col justify-between ${
                          !isUnlocked
                            ? 'border-slate-800 bg-slate-950/60 opacity-65'
                            : isActiveBiome
                            ? 'border-emerald-400 bg-emerald-950/30 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                            : 'border-slate-800 bg-slate-800/60 hover:border-emerald-500/60 hover:bg-slate-800/90'
                        }`}
                      >
                        {/* Top Visual Mini Strip */}
                        <div
                          className="h-15 w-full relative p-2.5 flex items-center justify-between"
                          style={{ background: b.skyGradient }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-950/70 text-white backdrop-blur-md border border-white/20">
                              {isVi ? b.accentBadgeVi : b.accentBadgeEn}
                            </span>
                            <span className="text-[10px] font-bold text-white/90 drop-shadow">
                              {isVi ? `Mốc: ${b.requiredWords.toLocaleString()} từ` : `Goal: ${b.requiredWords.toLocaleString()}w`}
                            </span>
                          </div>

                          {/* Guardian Mini Avatar */}
                          <div
                            className="w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-md shrink-0 bg-slate-900"
                            title={isVi ? `${beast.labelVi} (Thần thú hộ cõi)` : beast.labelEn}
                          >
                            <img
                              src={beast.image}
                              alt={isVi ? beast.labelVi : beast.labelEn}
                              className={`w-full h-full object-cover ${!isUnlocked ? 'grayscale opacity-60' : ''}`}
                            />
                          </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-slate-400">
                                {isVi ? b.realmTitleVi : b.realmTitleEn}
                              </span>
                              {isActiveBiome && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-0.5">
                                  <CheckCircle2 size={10} />
                                  <span>{isVi ? 'Đang Ngự Trị' : 'Active'}</span>
                                </span>
                              )}
                            </div>
                            <h4 className="font-black text-sm text-white mt-0.5">
                              {isVi ? b.nameVi : b.nameEn}
                            </h4>
                            <p className="text-[11px] text-slate-300/90 leading-snug line-clamp-2 mt-1">
                              {isVi ? b.ambientNoteVi : b.ambientNoteEn}
                            </p>
                          </div>

                          {/* Action Bar: Tách biệt rõ Đổi Cõi và Chọn Linh Thú Đồng Hành */}
                          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                            {/* Nút 1: Chọn Linh Thú này làm bạn đồng hành */}
                            {isBeastUnlocked ? (
                              isEquippedBeast ? (
                                <span className="text-[10px] font-black text-amber-300 bg-amber-400/15 border border-amber-400/40 px-2 py-1 rounded-xl flex items-center gap-1">
                                  <Sparkles size={11} className="text-amber-400" />
                                  <span>{isVi ? 'Đang đi cùng' : 'Equipped'}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectGuardian(b.guardianType);
                                    setLastSummonedLabel(isVi ? beast.labelVi : beast.labelEn);
                                    setTimeout(() => setLastSummonedLabel(null), 3500);
                                  }}
                                  className="text-[10px] font-bold text-amber-300 hover:text-white bg-slate-800/80 hover:bg-amber-600/30 border border-amber-400/30 hover:border-amber-400 px-2 py-1 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                                  title={isVi ? `Gọi ${beast.labelVi} làm bạn đồng hành` : `Equip ${beast.labelEn}`}
                                >
                                  <Sparkles size={10} className="text-amber-400" />
                                  <span>{isVi ? `Gọi ${beast.labelVi}` : `Equip`}</span>
                                </button>
                              )
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <Sparkles size={10} />
                                <span className="truncate max-w-[90px]">{isVi ? beast.labelVi : beast.labelEn}</span>
                              </span>
                            )}

                            {/* Nút 2: Vào Cõi Này (Chỉ đổi phong cảnh Ốc đảo, không bắt ép đổi linh thú) */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isUnlocked) handleSelectBiome(b.id);
                              }}
                              disabled={!isUnlocked || isActiveBiome}
                              className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                                !isUnlocked
                                  ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                                  : isActiveBiome
                                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold cursor-default'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm hover:scale-102'
                              }`}
                            >
                              {!isUnlocked ? (
                                <span className="flex items-center gap-1">
                                  <Lock size={11} />
                                  <span>{isVi ? `Khóa (+${remaining.toLocaleString()}w)` : `Locked (+${remaining.toLocaleString()}w)`}</span>
                                </span>
                              ) : isActiveBiome ? (
                                isVi ? '✦ Ở Cõi này' : '✦ Current Realm'
                              ) : (
                                isVi ? 'Vào Cõi Này' : 'Select Realm'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
                <span className="text-[11px] leading-tight text-center sm:text-left text-slate-300">
                  💡 {isVi
                    ? 'Cõi (cảnh quan) và Linh Thú (bạn đồng hành) hoàn toàn độc lập: Bạn có thể chọn bất kỳ linh thú nào (vd: Huyễn Điệp) đi cùng trong bất kỳ cõi nào (vd: Thái Cực Cõi)!'
                    : 'Realms and Companions are independent: You can keep any guardian (e.g. Butterfly) with you in any realm (e.g. Lotus Haven)!'}
                </span>
                <button
                  onClick={() => setShowRealmModal(false)}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shrink-0 transition-colors shadow-md"
                >
                  {isVi ? 'Xong' : 'Done'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full HD Splash Art Inspector Modal (Chi tiết & Bối cảnh Linh Thú khi bấm trong Bảng Phong Thần hoặc Khung Trợ Thủ) */}
      <AnimatePresence>
        {inspectingAsset && (() => {
          const isInspectingUnlocked = unlockedGuardians.includes(inspectingAsset.type);
          const inspectingReqWords = GUARDIAN_UNLOCK_MILESTONES[inspectingAsset.type];
          const effectiveWords = Math.max(totalWordsLearned, completedCount);
          const inspectingRemainingWords = Math.max(0, inspectingReqWords - effectiveWords);

          return (
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setInspectingAsset(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-5 max-w-md w-full shadow-2xl text-white space-y-3.5 relative overflow-hidden"
              >
                <button
                  onClick={() => setInspectingAsset(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer z-30"
                >
                  <X size={18} />
                </button>

                {/* Main Visual Box with Left/Right Navigation Chevrons */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-xl group">
                  <img
                    src={inspectingAsset.imageHd || inspectingAsset.image}
                    alt={isVi ? inspectingAsset.labelVi : inspectingAsset.labelEn}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      !isInspectingUnlocked ? 'filter grayscale brightness-[0.25] contrast-125' : ''
                    }`}
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Locked Overlay if beast is not yet awakened */}
                  {!isInspectingUnlocked && (() => {
                    const pct = Math.min(100, Math.round((effectiveWords / inspectingReqWords) * 100));
                    return (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/65 backdrop-blur-[2px] z-10 p-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-amber-400/60 flex items-center justify-center text-amber-400 shadow-xl mb-2">
                          <Lock size={22} />
                        </div>
                        <span className="text-sm font-black text-amber-300 drop-shadow">
                          {t('zen_codex_locked')}
                        </span>
                        <p className="text-xs text-slate-300 mt-1 max-w-xs font-semibold leading-relaxed">
                          {isVi
                            ? `Cần khai sáng thêm ${inspectingRemainingWords} từ vựng (${effectiveWords}/${inspectingReqWords} từ) để thức tỉnh thần thú này!`
                            : `Enlighten ${inspectingRemainingWords} more words (${effectiveWords}/${inspectingReqWords}) to awaken this beast!`}
                        </p>
                        <div className="w-48 h-2 bg-slate-800/90 rounded-full overflow-hidden mt-3 border border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-amber-300 font-bold mt-1">
                          {pct}% {isVi ? 'tiến độ mở khóa' : 'unlock progress'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Left Arrow Button (Xem linh vật trước) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = MYTHIC_POOL.indexOf(inspectingAsset.type);
                      const prevIdx = (idx - 1 + MYTHIC_POOL.length) % MYTHIC_POOL.length;
                      setInspectingAsset(MYTHIC_ASSETS[MYTHIC_POOL[prevIdx]!]);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-slate-950/70 hover:bg-slate-950/90 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg hover:scale-110"
                    title={isVi ? 'Linh Thú trước' : 'Previous beast'}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Right Arrow Button (Xem linh vật tiếp theo) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = MYTHIC_POOL.indexOf(inspectingAsset.type);
                      const nextIdx = (idx + 1) % MYTHIC_POOL.length;
                      setInspectingAsset(MYTHIC_ASSETS[MYTHIC_POOL[nextIdx]!]);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-slate-950/70 hover:bg-slate-950/90 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg hover:scale-110"
                    title={isVi ? 'Linh Thú kế tiếp' : 'Next beast'}
                  >
                    <ChevronRight size={20} />
                  </button>

                  <div className="absolute top-3 left-3 z-20">
                    <span
                      className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${
                        isInspectingUnlocked
                          ? `bg-gradient-to-r ${inspectingAsset.tierColor} text-slate-950`
                          : 'bg-slate-700 text-slate-300'
                      } shadow-md`}
                    >
                      {inspectingAsset.tier}
                    </span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20">
                    <h3 className="text-xl font-black text-amber-300">
                      {isVi ? inspectingAsset.labelVi : inspectingAsset.labelEn}
                    </h3>
                    <p className="text-xs text-amber-200/80 font-bold">
                      {isVi ? inspectingAsset.titleVi : inspectingAsset.titleEn} • {isVi ? inspectingAsset.elementVi : inspectingAsset.elementEn}
                    </p>
                  </div>
                </div>

                {/* Quick Beast Selector Strip (Dải chọn nhanh các linh vật khác) */}
                <div className="flex items-center justify-between gap-1.5 py-1 px-1 overflow-x-auto">
                  {MYTHIC_POOL.map((mType) => {
                    const bAsset = MYTHIC_ASSETS[mType];
                    const bUnlocked = unlockedGuardians.includes(mType);
                    const isSelected = inspectingAsset.type === mType;
                    const isCurrentActive = activeGuardian === mType;
                    return (
                      <button
                        key={mType}
                        onClick={() => setInspectingAsset(bAsset)}
                        className={`relative w-9 h-9 rounded-xl overflow-hidden transition-all cursor-pointer shrink-0 border ${
                          isSelected
                            ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/50'
                            : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                        }`}
                        title={isVi ? `${bAsset.labelVi} (${bAsset.tier})` : `${bAsset.labelEn} (${bAsset.tier})`}
                      >
                        <img
                          src={bAsset.image}
                          alt={isVi ? bAsset.labelVi : bAsset.labelEn}
                          className={`w-full h-full object-cover ${!bUnlocked ? 'filter grayscale brightness-[0.35]' : ''}`}
                        />
                        {!bUnlocked && (
                          <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center text-amber-300">
                            <Lock size={12} />
                          </div>
                        )}
                        {isCurrentActive && (
                          <span className="absolute bottom-0 inset-x-0 h-1 bg-amber-400 z-10" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Description Paragraph */}
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {isVi ? inspectingAsset.descVi : inspectingAsset.descEn}
                </p>

                {/* 🌟 HỆ THỐNG ĐỘT PHÁ SAO CẢNH GIỚI (1⭐ ➔ 5⭐: 3.000 ➔ 5.000 TỪ) */}
                {isInspectingUnlocked && (() => {
                  const currentStar = guardianStars[inspectingAsset.type] || 1;
                  const currentConfig =
                    GUARDIAN_STAR_TIERS.find((t) => t.stars === currentStar) || GUARDIAN_STAR_TIERS[0]!;
                  const nextStar = currentStar + 1;
                  const nextConfig = GUARDIAN_STAR_TIERS.find((t) => t.stars === nextStar);
                  const canAscend = Boolean(nextConfig && effectiveWords >= nextConfig.requiredWords);
                  const progressPct = nextConfig
                    ? Math.min(100, Math.round((effectiveWords / nextConfig.requiredWords) * 100))
                    : 100;

                  return (
                    <div className="p-3 rounded-2xl bg-slate-800/90 border border-amber-400/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-amber-300">
                            {isVi ? 'Cảnh Giới:' : 'Realm:'}
                          </span>
                          <span className="text-xs font-extrabold text-white">
                            {isVi ? currentConfig.titleVi : currentConfig.titleEn}
                          </span>
                        </div>
                        {/* 5 Stars Rating Bar */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              className={
                                s <= currentStar
                                  ? 'text-amber-400 fill-amber-400 filter drop-shadow'
                                  : 'text-slate-600'
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 italic leading-snug">
                        ✦ {isVi ? currentConfig.bonusDescVi : currentConfig.bonusDescEn}
                      </p>

                      {/* Next Star Ascension Requirement */}
                      {nextConfig ? (
                        <div className="pt-1.5 border-t border-slate-700/60 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-400">
                              {isVi ? `Đột phá ${nextStar} Sao (${nextConfig.titleVi}):` : `Ascend to ${nextStar} Stars:`}
                            </span>
                            <span className={canAscend ? 'text-emerald-400 font-black' : 'text-amber-300'}>
                              {effectiveWords} / {nextConfig.requiredWords} {isVi ? 'từ' : 'words'}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                canAscend
                                  ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 animate-pulse'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-300'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          {canAscend && (
                            <button
                              onClick={() => handleAscendGuardianStar(inspectingAsset.type)}
                              className="w-full mt-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer animate-bounce"
                            >
                              <Sparkles size={14} className="animate-spin" />
                              <span>
                                {isVi
                                  ? `Đột Phá Cảnh Giới Lên ${nextStar} Sao Ngay! ✨`
                                  : `Ascend to ${nextStar} Stars Now! ✨`}
                              </span>
                              <Sparkles size={14} className="animate-spin" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="pt-1 border-t border-slate-700/60 flex items-center justify-center gap-1.5 text-[11px] font-black text-amber-300">
                          <Award size={13} className="text-amber-400" />
                          <span>
                            {isVi
                              ? '👑 Cửu Thiên Chí Tôn (5 Sao Hoàn Mỹ) • Đại Sư 5.000 Từ'
                              : '👑 Celestial Sovereign (5-Star Pinnacle) • 5,000 Words Master'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Footer Action: Set Companion or Show Locked Notice */}
                <div className="pt-1">
                  {isInspectingUnlocked ? (
                    <button
                      onClick={() => {
                        handleSelectGuardian(inspectingAsset.type);
                        setLastSummonedLabel(isVi ? inspectingAsset.labelVi : inspectingAsset.labelEn);
                        setTimeout(() => setLastSummonedLabel(null), 4000);
                        setInspectingAsset(null);
                      }}
                      disabled={activeGuardian === inspectingAsset.type}
                      className={`w-full py-2.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer ${
                        activeGuardian === inspectingAsset.type
                          ? 'bg-slate-800 text-amber-300 border border-amber-400/30 cursor-default'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950'
                      }`}
                    >
                      {activeGuardian === inspectingAsset.type
                        ? (isVi ? '✓ Đang Đồng Hành' : '✓ Active Companion')
                        : (isVi ? 'Thiết Lập Đồng Hành ✨' : 'Set as Companion ✨')}
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-400 text-center font-bold text-xs flex items-center justify-center gap-1.5">
                      <Lock size={14} className="text-amber-400" />
                      <span>
                        {isVi
                          ? `Say ngủ • Cần thêm ${inspectingRemainingWords} từ để mở khóa (${effectiveWords}/${inspectingReqWords})`
                          : `Dormant • ${inspectingRemainingWords} more words needed (${effectiveWords}/${inspectingReqWords})`}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* 🌟 CHẾ ĐỘ NGẮM LINH THÚ TOÀN MÀN HÌNH (Chỉ khi bấm vào icon capsule trên thanh điều khiển khu vườn, chỉ ngắm đúng 1 linh thú đang chọn) */}
      <AnimatePresence>
        {showFullscreenGuardian && (
          <div
            className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 select-none"
            onClick={() => setShowFullscreenGuardian(false)}
          >
            {/* Top Bar: Close Button & Tier */}
            <div
              className="flex items-center justify-between w-full max-w-4xl mx-auto z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowFullscreenGuardian(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md text-xs sm:text-sm font-bold transition-all cursor-pointer border border-white/20 shadow-lg"
              >
                <X size={18} />
                <span>{isVi ? 'Đóng chế độ ngắm' : 'Exit View'}</span>
              </button>

              <span
                className={`text-xs sm:text-sm font-black px-3.5 py-1 rounded-full bg-gradient-to-r ${currentGuardianAsset.tierColor} text-slate-950 shadow-md`}
              >
                {currentGuardianAsset.tier}
              </span>
            </div>

            {/* Main Stage: Only this single active Linh Thú in Full HD */}
            <div
              className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center my-2 min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.3 }}
                className="relative max-h-full flex items-center justify-center"
              >
                <img
                  src={currentGuardianAsset.imageHd || currentGuardianAsset.image}
                  alt={isVi ? currentGuardianAsset.labelVi : currentGuardianAsset.labelEn}
                  className="max-h-[74vh] sm:max-h-[80vh] w-auto max-w-full rounded-3xl object-contain shadow-2xl border-2 border-amber-400/40"
                  style={{
                    filter: `drop-shadow(0 0 45px ${currentGuardianAsset.glowColor}40)`,
                  }}
                  loading="eager"
                  decoding="async"
                />
              </motion.div>
            </div>

            {/* Bottom: Minimal Clean Title & Element */}
            <div
              className="text-center py-1 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-wide drop-shadow-md">
                  {isVi ? currentGuardianAsset.labelVi : currentGuardianAsset.labelEn}
                </h2>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-300 flex items-center gap-1 shadow-sm">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{isVi ? `${guardianStars[activeGuardian] || 1} Sao` : `${guardianStars[activeGuardian] || 1} Star`}</span>
                </span>
              </div>
              <p className="text-xs text-amber-200/75 font-semibold mt-0.5">
                {(() => {
                  const cStar = guardianStars[activeGuardian] || 1;
                  const cCfg = GUARDIAN_STAR_TIERS.find((t) => t.stars === cStar);
                  return cCfg ? `${isVi ? cCfg.titleVi : cCfg.titleEn} • ` : '';
                })()}
                {isVi ? currentGuardianAsset.titleVi : currentGuardianAsset.titleEn} • {isVi ? currentGuardianAsset.elementVi : currentGuardianAsset.elementEn}
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Sound Mixer Modal / Panel */}
      <AnimatePresence>
        {showMixerModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-emerald-500" />
                  <h3 className="font-black text-sm text-slate-800 dark:text-white">
                    {t('zen_sound_modal_title')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowMixerModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Master Power Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div>
                  <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 block">
                    {isVi ? 'Bật / Tắt Toàn Bộ Âm Thanh' : 'Master Audio Power'}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {t('zen_sound_modal_subtitle')}
                  </span>
                </div>
                <button
                  onClick={handleToggleSoundMaster}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isSoundActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isSoundActive ? (isVi ? 'ĐANG BẬT' : 'ON') : (isVi ? 'ĐANG TẮT' : 'OFF')}
                </button>
              </div>

              {/* Master Volume Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>{t('zen_sound_master_vol')}</span>
                  <span>{Math.round(masterVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVol}
                  onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Presets 1-Chạm */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  {t('zen_sound_presets_label')}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  {ZEN_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.id)}
                      className="p-2.5 rounded-xl border border-emerald-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 text-left transition-colors cursor-pointer"
                    >
                      <span className="block text-slate-800 dark:text-white font-black text-xs">
                        {preset.icon} {isVi ? preset.nameVi : preset.nameEn}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {isVi ? preset.descVi : preset.descEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Sound Channels */}
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {soundChannels.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <span className="text-xl">{ch.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                        <span className="truncate">{isVi ? ch.nameVi : ch.nameEn}</span>
                        <span className="text-[10px] text-slate-400">
                          {Math.round(ch.volume * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={ch.volume}
                        disabled={!ch.enabled}
                        onChange={(e) => handleChannelVolume(ch.id, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
                      />
                    </div>

                    <button
                      onClick={() => handleToggleChannel(ch.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black cursor-pointer ${
                        ch.enabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {ch.enabled ? (isVi ? 'Bật' : 'On') : (isVi ? 'Tắt' : 'Off')}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-5 flex flex-col gap-5">
        {/* Grand Living Sanctuary Canvas (Living Plants, Flowers, Houses, Water Lotus) */}
        <GrandZenCanvas
          biome={currentBiome}
          gardenEntities={gardenEntities}
          guardian={currentGuardianAsset}
          guardianStar={guardianStars[activeGuardian] || 1}
          completedCount={completedCount}
          onOpenFullscreenGuardian={() => setShowFullscreenGuardian(true)}
          onOpenRealmSelector={() => setShowRealmModal(true)}
          isExpanded={isCanvasExpanded}
          onToggleExpand={handleToggleExpand}
          onInspectGarden={(item) => setInspectingGardenItem(item)}
          currentCard={card}
          onPrevCard={handleGoPrev}
          onNextCard={handleGoNext}
          onSpeakWord={speakWord}
          onResetGarden={handleResetGarden}
          onUpdateItemPosition={handleUpdateItemPosition}
          onResetLayout={handleResetLayout}
          onPlaceCatalogItem={handlePlaceCatalogItem}
          onStoreCatalogItem={handleStoreCatalogItem}
        />

        {/* Flourished Celebration Banner */}
        <AnimatePresence>
          {showFlourishedBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.92 }}
              className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow-2xl text-center flex flex-col items-center gap-1.5"
            >
              <div className="flex items-center gap-2 text-sm sm:text-base font-black">
                <Sparkles size={18} className="text-amber-200 animate-spin" />
                <span>{isVi ? 'ỐC ĐẢO ĐÃ THĂNG HOA BỪNG NỞ!' : 'SANCTUARY HAS ASCENDED!'}</span>
                <Sparkles size={18} className="text-amber-200 animate-spin" />
              </div>
              <p className="text-xs text-emerald-100 font-medium max-w-md">
                {isVi ? 'Ốc đảo tràn đầy sinh khí rực rỡ tại: ' : 'Sanctuary flourishing with life at: '}<strong>{isVi ? currentBiome.nameVi : currentBiome.nameEn}</strong>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plant Blooming Notification Toast */}
        <AnimatePresence>
          {lastGardenSpawned && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="p-3 rounded-2xl bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 border border-emerald-400"
            >
              <Sparkles size={16} className="animate-spin text-amber-200" />
              <span>🌸 {isVi ? 'VỪA NỞ RỘ TRONG KHU VƯỜN: ' : 'JUST BLOOMED IN SANCTUARY: '}<strong>{lastGardenSpawned}</strong> {isVi ? 'đung đưa trong gió!' : 'swaying in the breeze!'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summoned Notification Toast */}
        <AnimatePresence>
          {lastSummonedLabel && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 border border-amber-300"
            >
              <Sparkles size={16} className="animate-spin text-white" />
              <span>✨ {isVi ? 'TRIỆU HỒI THẦN THÚ: ' : 'MYTHIC SUMMON: '}<strong>{lastSummonedLabel}</strong> ({currentGuardianAsset.tier}) {isVi ? 'GIA HỘ CHO ỐC ĐẢO!' : 'BLESSES YOUR SANCTUARY!'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SM-2 Spaced Repetition SRS Toast */}
        <AnimatePresence>
          {lastSM2Notification && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`p-3 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 border ${
                lastSM2Notification.isNew
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 border-emerald-400'
                  : 'bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 border-indigo-400'
              }`}
            >
              <Brain size={16} className="text-amber-300 animate-pulse shrink-0" />
              {lastSM2Notification.isNew ? (
                <span>
                  ✨ {isVi ? 'TỪ MỚI GIÁC NGỘ: ' : 'NEW WORD ENLIGHTENED: '}
                  <strong>{lastSM2Notification.word}</strong> (+1 vào kho từ vựng) •{' '}
                  {isVi
                    ? `Lên lịch ôn sau ${lastSM2Notification.interval} ngày`
                    : `Review in ${lastSM2Notification.interval}d`}
                </span>
              ) : (
                <span>
                  🌿 {isVi ? 'CỦNG CỐ TRÍ NHỚ DÀI HẠN: ' : 'REINFORCING LONG-TERM MEMORY: '}
                  <strong>{lastSM2Notification.word}</strong> ({isVi ? 'Đã có trong vốn từ' : 'In vocabulary'}) •{' '}
                  {isVi
                    ? `Hẹn gặp lại sau ${lastSM2Notification.interval} ngày`
                    : `Next review in ${lastSM2Notification.interval}d`}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Guardian Companion Bar (Linh Thú Hộ Mệnh Liên Quân) */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-400/40 dark:border-amber-500/30 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div
              className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md cursor-pointer group shrink-0"
              onClick={() => setInspectingAsset(currentGuardianAsset)}
              title={isVi ? 'Bấm để xem ảnh HD và chi tiết linh thú' : 'Click to inspect full HD artwork'}
            >
              <img
                src={currentGuardianAsset.image}
                alt={isVi ? currentGuardianAsset.labelVi : currentGuardianAsset.labelEn}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-300">
                  {isVi ? currentGuardianAsset.labelVi : currentGuardianAsset.labelEn}
                </span>
                <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm shrink-0">
                  {currentGuardianAsset.tier}
                </span>
                <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 shrink-0 flex items-center gap-0.5">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span>{guardianStars[activeGuardian] || 1}</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 shrink-0">
                  {isVi ? currentGuardianAsset.elementVi : currentGuardianAsset.elementEn}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>
                  {(() => {
                    const cStar = guardianStars[activeGuardian] || 1;
                    const cCfg = GUARDIAN_STAR_TIERS.find((t) => t.stars === cStar);
                    return cCfg ? (isVi ? `✦ Cảnh giới: ${cCfg.titleVi}` : `✦ Realm: ${cCfg.titleEn}`) : '';
                  })()}
                </span>
                <span>•</span>
                <span>{isVi ? 'Gia hộ tĩnh tâm & trí tuệ' : 'Blessing focus & wisdom'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(() => {
              const cStar = guardianStars[activeGuardian] || 1;
              const nStar = cStar + 1;
              const nCfg = GUARDIAN_STAR_TIERS.find((t) => t.stars === nStar);
              const effWords = Math.max(totalWordsLearned, completedCount);
              const canAscend = Boolean(nCfg && effWords >= nCfg.requiredWords);
              if (canAscend) {
                return (
                  <button
                    onClick={() => handleAscendGuardianStar(activeGuardian)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-md cursor-pointer animate-pulse"
                    title={isVi ? `Bấm để đột phá lên ${nStar} sao!` : `Click to ascend to ${nStar} stars!`}
                  >
                    <Sparkles size={13} className="animate-spin" />
                    <span>{isVi ? `Đột Phá ${nStar} Sao!` : `Ascend ${nStar} Stars!`}</span>
                  </button>
                );
              }
              return null;
            })()}
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30">
              <Sparkles size={12} className="text-amber-500" />
              <span>{unlockedGuardians.length}/8 {isVi ? 'Thần Thú' : 'Guardians'}</span>
            </span>
            <button
              onClick={() => setShowCodexModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-200/60 dark:border-slate-700 cursor-pointer transition-colors"
            >
              <Eye size={13} />
              <span>{isVi ? 'Đổi Linh Thú' : 'Change Guardian'}</span>
            </button>
          </div>
        </div>

        {/* 3-STEP FLOW PROGRESS BAR */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-slate-800 shadow-sm gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-200">
              {isVi ? `Từ ${currentIndex + 1}/${cards.length}` : `Word ${currentIndex + 1}/${cards.length}`}
            </span>
            {completedCardIds.length > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-500" />
                <span>{isVi ? `Đã đúc: ${completedCardIds.length}` : `Mastered: ${completedCardIds.length}`}</span>
              </span>
            )}
            {completedCardIds.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(isVi ? 'Bạn có muốn đặt lại tiến độ để học lại bộ thẻ này từ đầu?' : 'Restart deck progress from beginning?')) {
                    setCurrentIndex(0);
                    setCompletedCardIds([]);
                    saveDeckProgress(0, []);
                  }
                }}
                className="text-[10px] text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-0.5 font-medium ml-1"
                title={isVi ? 'Học lại từ đầu' : 'Restart deck'}
              >
                <RotateCcw size={10} />
                <span>{isVi ? 'Học lại' : 'Restart'}</span>
              </button>
            )}
            <button
              onClick={() => {
                setOnlyDueSM2((prev) => !prev);
                setCurrentIndex(0);
                saveDeckProgress(0, completedCardIds);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer border ${
                onlyDueSM2
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-700'
              }`}
              title={isVi ? (onlyDueSM2 ? 'Bấm để hiển thị lại toàn bộ thẻ' : 'Bấm để chỉ ôn các từ cần ôn hôm nay') : (onlyDueSM2 ? 'Show all cards' : 'Show only due cards')}
            >
              {onlyDueSM2 ? (
                <RotateCcw size={12} className="text-amber-300" />
              ) : (
                <Brain size={12} className="text-indigo-500 dark:text-indigo-400" />
              )}
              <span>
                {onlyDueSM2
                  ? (isVi ? `Hiện tất cả (${rawCards.length} từ)` : `Show All (${rawCards.length})`)
                  : (isVi ? `Ôn ${srsStats.dueTodayCount} từ hôm nay` : `Review ${srsStats.dueTodayCount} Due`)}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { num: 1, label: `1. ${t('zen_step_1_title')}` },
              { num: 2, label: `2. ${t('zen_step_2_title')}` },
              { num: 3, label: `3. ${t('zen_step_3_title')}` },
            ].map((s) => (
              <div
                key={s.num}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center gap-1 ${
                  step === s.num
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-950'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent dark:border-slate-700/60'
                }`}
              >
                {step > s.num ? <CheckCircle2 size={12} /> : null}
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3-STEP SEQUENTIAL WORKSPACE */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <AnimatePresence mode="wait">
            {/* ============================================================== */}
            {/* BƯỚC 1: LẬT CHIÊM NGHIỆM (MINDFUL CONTEMPLATION) */}
            {/* ============================================================== */}
            {step === 1 && (
              <motion.div
                key={`step1-${currentIndex}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-lg flex flex-col items-center gap-5"
              >
                <div
                  onClick={() => setIsFlipped((f) => !f)}
                  className="relative w-full cursor-pointer select-none"
                  style={{ perspective: '1200px', height: '230px' }}
                >
                  <motion.div
                    className="relative w-full h-full"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {/* Front: English */}
                    <div
                      className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-6 shadow-xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-slate-900 dark:to-slate-800 border-2 border-emerald-300 dark:border-emerald-700/60 transition-colors"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                      }}
                    >
                      <div className="absolute top-3.5 right-3.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(card.front);
                          }}
                          className="p-2.5 rounded-2xl bg-white/80 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm transition-all cursor-pointer"
                          title={t('zen_hud_speak')}
                        >
                          <Volume2 size={20} />
                        </button>
                      </div>

                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
                        1. {t('zen_step_1_title')}
                      </span>
                      <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 dark:text-emerald-50 text-center tracking-wide">
                        {card.front}
                      </h2>

                      {/* SM-2 Status Badge on Card */}
                      {(() => {
                        const rec = getCardSM2Record(card.id, deck.id);
                        if (rec && rec.interval > 0) {
                          return (
                            <span className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1 mt-1 shadow-xs">
                              <Brain size={11} className="text-indigo-600 dark:text-indigo-400" />
                              <span>{isVi ? `Đã ôn ${rec.repetition} lần · Sau ${rec.interval} ngày ôn tiếp` : `Reviewed ${rec.repetition}x · Due in ${rec.interval}d`}</span>
                            </span>
                          );
                        }
                        return (
                          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 mt-1 shadow-xs">
                            <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
                            <span>{isVi ? 'Từ mới bắt đầu học' : 'New word'}</span>
                          </span>
                        );
                      })()}

                      <span className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-2.5 font-semibold flex items-center gap-1">
                        {t('zen_tap_to_flip')} ✨
                      </span>
                    </div>

                    {/* Back: Vietnamese */}
                    <div
                      className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-6 shadow-xl bg-gradient-to-br from-white to-teal-50 dark:from-slate-900 dark:to-slate-800 border-2 border-teal-300 dark:border-teal-600/60 transition-colors"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-2">
                        {isVi ? 'Ý nghĩa Tiếng Việt' : 'Vietnamese Meaning'}
                      </span>
                      <p className="text-2xl sm:text-3xl font-black text-teal-950 dark:text-teal-50 text-center px-4 leading-relaxed">
                        {card.back}
                      </p>
                      <span className="text-xs text-slate-400 dark:text-slate-400 mt-3 font-medium">
                        {isVi ? 'Lật lại mặt trước để nghe phát âm' : 'Flip back to hear pronunciation'}
                      </span>
                    </div>
                  </motion.div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-200 dark:shadow-emerald-950 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <span>{t('zen_btn_ready_water')} 🌸</span>
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* BƯỚC 2: TƯỚI HOA NỞ (BLOOM CHOICE - RECALL MEANING) */}
            {/* ============================================================== */}
            {step === 2 && (
              <motion.div
                key={`step2-${currentIndex}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-lg flex flex-col items-center gap-4"
              >
                <div className="w-full p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 shadow-md text-center flex flex-col items-center relative">
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => speakWord(card.front)}
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 mb-1">
                    2. {t('zen_step_2_title')}
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                    {card.front}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                    {t('zen_quiz_prompt')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {choices.map((choice, i) => {
                    const isChosen = selectedOption === choice;
                    const isRight = choice === card.back;
                    let styleClass =
                      'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-800/80';

                    if (bloomStatus === 'correct' && isRight) {
                      styleClass = 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-950 scale-102';
                    } else if (isChosen && bloomStatus === 'wrong') {
                      styleClass = 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 text-rose-700 dark:text-rose-200';
                    }

                    return (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBloomSelect(choice)}
                        className={`p-4 rounded-2xl border-2 text-left font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-between cursor-pointer shadow-sm ${styleClass}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-black flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                            {i + 1}
                          </span>
                          <span className="truncate">{choice}</span>
                        </div>
                        {bloomStatus === 'correct' && isRight && <Sparkles size={16} className="text-amber-200 shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between w-full pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {isVi ? '← Lật xem lại thẻ' : '← Review Card'}
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isVi ? 'Bỏ qua, tới xếp sỏi luôn ➔' : 'Skip to Stone Scramble ➔'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* BƯỚC 3: XẾP SỎI CHỮ (STONE SPELL - SPELLING & MANIFESTATION) */}
            {/* ============================================================== */}
            {step === 3 && (
              <motion.div
                key={`step3-${currentIndex}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-lg flex flex-col items-center gap-4"
              >
                <div className="w-full p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 shadow-md text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 mb-1">
                    3. {t('zen_step_3_title')}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {card.back}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                    {isVi ? 'Ghép các viên sỏi chữ cái thành từ đúng' : 'Assemble the letter stones to complete the word'}
                  </p>
                </div>

                {/* Placed Letter Slots */}
                <div className="flex flex-wrap items-center justify-center gap-2 min-h-[50px] p-3 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700 w-full">
                  {placedLetters.length === 0 ? (
                    <span className="text-xs text-slate-400 dark:text-slate-400 italic">
                      {isVi ? 'Chạm sỏi phía dưới để đặt vào đây...' : 'Tap pebbles below to place here...'}
                    </span>
                  ) : (
                    placedLetters.map((char, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleUndoStone(idx)}
                        className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-md cursor-pointer hover:bg-emerald-700 transition-colors"
                        title={t('zen_stone_clear_last')}
                      >
                        {char}
                      </button>
                    ))
                  )}
                </div>

                {/* Available Floating Stones */}
                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  {availableLetters.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => handleStoneTap(it)}
                      className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-slate-100 font-extrabold text-base flex items-center justify-center shadow-md hover:border-emerald-500 cursor-pointer transition-colors"
                    >
                      {it.char}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between w-full pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleHintStone}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-bold cursor-pointer"
                    >
                      <HelpCircle size={13} /> {isVi ? 'Gợi ý 1 chữ' : 'Hint 1 Letter'}
                    </button>
                    <button
                      onClick={() => {
                        const targetTerm = stripParentheses(card.front) || card.front;
                        const cleanWord = targetTerm.replace(/\s+/g, '').toUpperCase();
                        const chars = cleanWord.split('').map((c, i) => ({ id: `${c}-${i}`, char: c }));
                        setAvailableLetters([...chars].sort(() => Math.random() - 0.5));
                        setPlacedLetters([]);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <RotateCcw size={13} /> {t('zen_stone_reset')}
                    </button>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {isVi ? '← Quay lại tưới hoa' : '← Back to Watering'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={handleGoPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-transparent dark:border-slate-700"
            >
              <ChevronLeft size={14} /> {t('zen_hud_prev')}
            </button>
            <button
              onClick={handleGoNext}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200 dark:shadow-emerald-950 cursor-pointer"
            >
              {t('zen_hud_next')} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
