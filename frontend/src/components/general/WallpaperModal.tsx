import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Upload,
  Link2,
  Sliders,
  RotateCcw,
  X,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  useWallpaper,
  WALLPAPER_PRESETS,
} from '../../contexts/WallpaperContext';

export default function WallpaperModal() {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const {
    config,
    setPreset,
    setCustomUrl,
    setUploadImage,
    setBlur,
    setOverlayOpacity,
    setBrightness,
    resetWallpaper,
    isModalOpen,
    setIsModalOpen,
  } = useWallpaper();

  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url' | 'adjust'>('presets');
  const [inputUrl, setInputUrl] = useState(config.type === 'custom_url' ? config.url : '');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isModalOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleSelectPreset = (presetId: string) => {
    setPreset(presetId);
    showFeedback(isVi ? '✨ Đã áp dụng hình nền thành công!' : '✨ Wallpaper applied!');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(isVi ? 'Vui lòng chọn tệp hình ảnh!' : 'Please select an image file!');
      return;
    }

    // Limit file to ~4MB to avoid localStorage saturation
    if (file.size > 4 * 1024 * 1024) {
      alert(isVi ? 'Kích thước ảnh tối đa 4MB' : 'Max image size is 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadImage(reader.result);
        showFeedback(isVi ? '✨ Đã tải ảnh lên & áp dụng thành công!' : '✨ Uploaded and applied!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (inputUrl.trim()) {
      setCustomUrl(inputUrl);
      showFeedback(isVi ? '✨ Đã áp dụng link ảnh thành công!' : '✨ Link applied!');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="max-w-2xl w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md">
                <Image size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isVi ? 'Tùy Chỉnh Hình Nền Không Gian Học' : 'Customize Background Wallpaper'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isVi
                    ? 'Thay đổi hình nền theo phong cách của bạn tương tự Google'
                    : 'Personalize your workspace background just like Google'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Feedback Toast Notification */}
          <AnimatePresence>
            {feedbackToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-6 mt-3 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2"
              >
                <Sparkles size={14} />
                <span>{feedbackToast}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 flex gap-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
            {[
              { id: 'presets', label: isVi ? 'Bộ Sưu Tập Có Sẵn' : 'Curated Gallery', icon: <Sparkles size={14} /> },
              { id: 'upload', label: isVi ? 'Tải Ảnh Lên' : 'Upload Image', icon: <Upload size={14} /> },
              { id: 'url', label: isVi ? 'Nhập Link Ảnh' : 'Image URL', icon: <Link2 size={14} /> },
              { id: 'adjust', label: isVi ? 'Hiệu Ứng Mờ & Tối' : 'Blur & Tint', icon: <Sliders size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* 1. Presets */}
            {activeTab === 'presets' && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WALLPAPER_PRESETS.map((preset) => {
                    const isSelected = config.type === 'preset' && config.presetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer border-2 transition-all shadow-sm ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={preset.thumbnail}
                          alt={preset.nameEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                          <span className="text-[11px] font-bold text-white truncate">
                            {isVi ? preset.nameVi : preset.nameEn}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Upload */}
            {activeTab === 'upload' && (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-center bg-slate-50 dark:bg-slate-800/40">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <Upload size={28} />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">
                  {isVi ? 'Chọn ảnh từ máy tính hoặc điện thoại' : 'Select an image from your device'}
                </h4>
                <p className="text-xs text-slate-400 mb-4 max-w-sm">
                  {isVi ? 'Hỗ trợ định dạng JPG, PNG, WEBP tối đa 4MB' : 'Supports JPG, PNG, WEBP up to 4MB'}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  {isVi ? 'Tải ảnh lên ngay' : 'Browse File'}
                </button>
              </div>
            )}

            {/* 3. URL */}
            {activeTab === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    {isVi ? 'Đường dẫn ảnh trực tiếp (URL)' : 'Direct Image Link (URL)'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleApplyUrl}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all"
                    >
                      {isVi ? 'Áp dụng' : 'Apply'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  {isVi
                    ? '💡 Gợi ý: Bạn có thể dán link ảnh chất lượng cao từ Unsplash, Pexels hoặc Pinterest.'
                    : '💡 Tip: You can paste high resolution photo links from Unsplash, Pexels, etc.'}
                </p>
              </div>
            )}

            {/* 4. Adjustments */}
            {activeTab === 'adjust' && (
              <div className="space-y-5 p-2">
                {/* Blur slider */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">
                      {isVi ? 'Độ mờ nền (Background Blur)' : 'Background Blur'}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400">{config.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={config.blur}
                    onChange={(e) => setBlur(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Dark Overlay Opacity */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">
                      {isVi ? 'Lớp phủ tương phản tối (Dark Tint Overlay)' : 'Dark Overlay Opacity'}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {Math.round(config.overlayOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.85"
                    step="0.05"
                    value={config.overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isVi
                      ? 'Tăng độ tối giúp văn bản và thẻ từ vựng luôn hiển thị rõ ràng, dễ đọc.'
                      : 'Higher opacity ensures all text and flashcards remain readable.'}
                  </p>
                </div>

                {/* Brightness */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">
                      {isVi ? 'Độ sáng ảnh (Brightness)' : 'Image Brightness'}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {Math.round(config.brightness * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="1.2"
                    step="0.05"
                    value={config.brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
            <button
              onClick={resetWallpaper}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>{isVi ? 'Khôi phục mặc định' : 'Reset to Default'}</span>
            </button>

            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all cursor-pointer"
            >
              {isVi ? 'Hoàn tất & Đóng' : 'Done'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
