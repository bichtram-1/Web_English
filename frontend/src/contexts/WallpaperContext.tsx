import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface WallpaperPreset {
  id: string;
  nameVi: string;
  nameEn: string;
  thumbnail: string;
  url: string;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'galaxy',
    nameVi: '🌌 Vũ Trụ Huyền Ảo',
    nameEn: 'Cosmic Nebula',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=300&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'mountains',
    nameVi: '🏔️ Hoàng Hôn Dãy Núi',
    nameEn: 'Sunset Mountains',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=300&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'cozy_study',
    nameVi: '☕ Góc Học Tập & Sách',
    nameEn: 'Cozy Library Loft',
    thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=300&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2074&auto=format&fit=crop',
  },
  {
    id: 'sakura',
    nameVi: '🌸 Hoa Anh Đào',
    nameEn: 'Sakura Blossom',
    thumbnail: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=300&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2076&auto=format&fit=crop',
  },
  {
    id: 'nature_forest',
    nameVi: '🌿 Rừng Thông Yên Tĩnh',
    nameEn: 'Misty Forest',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=300&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'cyberpunk',
    nameVi: '🌆 Đêm Thành Phố Neon',
    nameEn: 'Neon Nightscape',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=2047&auto=format&fit=crop',
  },
  {
    id: 'minimal_sunset',
    nameVi: '🌅 Gradient Hoàng Hôn',
    nameEn: 'Aesthetic Sunset',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop',
  },
  {
    id: 'aurora',
    nameVi: '✨ Cực Quang Tuyệt Đẹp',
    nameEn: 'Northern Lights',
    thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=300&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2070&auto=format&fit=crop',
  },
];

export interface WallpaperConfig {
  enabled: boolean;
  type: 'none' | 'preset' | 'custom_url' | 'upload';
  presetId?: string;
  url: string;
  blur: number; // in px: 0 - 20
  overlayOpacity: number; // 0.0 - 0.85
  brightness: number; // 0.4 - 1.2
}

const DEFAULT_WALLPAPER: WallpaperConfig = {
  enabled: false,
  type: 'none',
  url: '',
  blur: 6,
  overlayOpacity: 0.45,
  brightness: 0.8,
};

const WALLPAPER_STORAGE_KEY = 'lingualeap_custom_wallpaper_config';

interface WallpaperContextValue {
  config: WallpaperConfig;
  setPreset: (presetId: string) => void;
  setCustomUrl: (url: string) => void;
  setUploadImage: (dataUrl: string) => void;
  setBlur: (blur: number) => void;
  setOverlayOpacity: (opacity: number) => void;
  setBrightness: (brightness: number) => void;
  resetWallpaper: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const WallpaperContext = createContext<WallpaperContextValue | undefined>(undefined);

export function WallpaperProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WallpaperConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_WALLPAPER;
    try {
      const saved = localStorage.getItem(WALLPAPER_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_WALLPAPER, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse wallpaper settings:', e);
    }
    return DEFAULT_WALLPAPER;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save wallpaper settings:', e);
    }
  }, [config]);

  const setPreset = (presetId: string) => {
    const preset = WALLPAPER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setConfig((prev) => ({
      ...prev,
      enabled: true,
      type: 'preset',
      presetId,
      url: preset.url,
    }));
  };

  const setCustomUrl = (url: string) => {
    setConfig((prev) => ({
      ...prev,
      enabled: Boolean(url.trim()),
      type: 'custom_url',
      url: url.trim(),
    }));
  };

  const setUploadImage = (dataUrl: string) => {
    setConfig((prev) => ({
      ...prev,
      enabled: true,
      type: 'upload',
      url: dataUrl,
    }));
  };

  const setBlur = (blur: number) => {
    setConfig((prev) => ({ ...prev, blur }));
  };

  const setOverlayOpacity = (overlayOpacity: number) => {
    setConfig((prev) => ({ ...prev, overlayOpacity }));
  };

  const setBrightness = (brightness: number) => {
    setConfig((prev) => ({ ...prev, brightness }));
  };

  const resetWallpaper = () => {
    setConfig(DEFAULT_WALLPAPER);
  };

  return (
    <WallpaperContext.Provider
      value={{
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
      }}
    >
      {children}
    </WallpaperContext.Provider>
  );
}

export function useWallpaper() {
  const context = useContext(WallpaperContext);
  if (!context) {
    throw new Error('useWallpaper must be used within a WallpaperProvider');
  }
  return context;
}
