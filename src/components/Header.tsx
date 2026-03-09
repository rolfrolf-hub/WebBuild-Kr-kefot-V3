
import React, { useState, useEffect } from 'react';
import { BrandState } from '../types';
import { InlineText } from './InlineText';
import Portal from './Portal';

interface HeaderProps {
  brandData: BrandState;
  onUpdate: (newData: Partial<BrandState>) => void;
  onPublish: () => void;
  onReset: () => void;
  activePage: 'home' | 'about' | 'contact' | 'epk';
  onNavigate: (page: 'home' | 'about' | 'contact' | 'epk') => void;
  onManualSave: () => void;
  hasUnsavedChanges: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

const Header: React.FC<HeaderProps> = ({
  brandData,
  onUpdate,
  onPublish,
  onReset,
  activePage,
  onNavigate,
  onManualSave,
  hasUnsavedChanges,
  scrollContainerRef
}) => {
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // Scroll fade effect
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(scrollContainerRef?.current?.scrollTop || window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    const target = scrollContainerRef?.current || window;
    target.addEventListener('scroll', handleScroll as any, { passive: true });
    return () => target.removeEventListener('scroll', handleScroll as any);
  }, [scrollContainerRef]);

  const handleLogoMouseEnter = () => {
    setIsLogoHovered(true);
    setTimeout(() => {
      setIsLogoHovered(false);
    }, 500);
  };

  const handleLogoMouseLeave = () => {
    setIsLogoHovered(false);
  };

  const handleSaveClick = () => {
    onManualSave();
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  const vis = brandData.pageVisibility || { home: true, about: true, contact: true, epk: false };
  const navItems = [
    { key: 'home', label: brandData.navNames.home },
    ...(vis.about !== false ? [{ key: 'about', label: brandData.navNames.about }] : []),
    ...(vis.contact !== false ? [{ key: 'contact', label: brandData.navNames.contact }] : []),
    ...(vis.epk ? [{ key: 'epk', label: brandData.navNames.epk || 'EPK' }] : []),
  ];

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const calculateScrollOpacity = (scrollY: number) => {
    const fadeStart = 100;
    const fadeEnd = brandData.isMobilePreview ? 680 : 800; // 15% faster (800 * 0.85 = 680)

    if (scrollY <= fadeStart) return 1.0;
    if (scrollY >= fadeEnd) return 0.0;

    return 1.0 - (scrollY - fadeStart) / (fadeEnd - fadeStart);
  };

  const calculateHeaderStyle = () => {
    // We already passed the hex color and opacity directly
    const opacity = brandData.menuOpacity ?? 0.4;
    const tintColor = brandData.menuTintColor || brandData.accentColor || '#000000';
    const tintAmount = brandData.menuTintAmount ?? 0.1;

    const rgb = hexToRgb(tintColor);

    // Create liquid glass effect: subtle tint over dark base
    const r = rgb ? Math.round(rgb.r * tintAmount + 10) : 10;
    const g = rgb ? Math.round(rgb.g * tintAmount + 10) : 10;
    const b = rgb ? Math.round(rgb.b * tintAmount + 10) : 10;

    // Apply scroll-based fade
    const scrollOpacity = calculateScrollOpacity(scrollY);

    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      opacity: scrollOpacity
    };
  };

  const isMobile = brandData.isMobilePreview;

  return (
    <header
      style={calculateHeaderStyle()}
      className={`py-4 ${isMobile ? 'px-4 h-20' : 'md:py-6 md:px-8 h-20 md:h-24'} flex justify-between items-center border-b border-white/5 backdrop-blur-3xl absolute top-0 w-full z-[60] transition-all duration-300 shadow-lg shadow-black/20`}
    >
      <div
        className={`flex items-center ${isMobile ? 'gap-2' : 'gap-2 md:gap-3'} cursor-pointer group mobile-nav-logo`}
        onClick={() => onNavigate('home')}
        onMouseEnter={handleLogoMouseEnter}
        onMouseLeave={handleLogoMouseLeave}
      >
        <div className={`w-8 h-8 ${isMobile ? '' : 'md:w-10 md:h-10'} bg-transparent flex items-center justify-center rotate-45 transition-transform duration-500 overflow-hidden relative shrink-0 ${isLogoHovered ? 'rotate-90' : ''}`}>
          <svg className={`-rotate-45 transition-transform duration-500 relative z-10 w-[22px] h-[22px] ${isMobile ? '' : 'md:w-[28px] md:h-[28px]'} ${isLogoHovered ? 'rotate-[-90deg]' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 2.5C13.2 2.5 13.5 5.5 13.2 10.5C12.9 15.5 12.5 20.5 12.2 23.5C12 21.5 12.5 15.5 13 10.5C13.5 5.5 12.8 2.5 12.5 2.5Z" fill="white" />
            <path d="M4 19C7.5 15.5 11.5 11 17 7L18 6C13.5 9.5 8.5 14.5 5 20L4 19Z" fill="white" />
            <path d="M12.8 11C15 13.5 17.5 16 20 18.5L19 19.5C16.5 17 14 14.5 12.8 11Z" fill="white" />
            <path d="M17 7L20.5 5L19.5 4L16 6L17 7Z" fill="white" />
          </svg>
        </div>
        <div className={`overflow-hidden ${isMobile ? 'hidden' : 'hidden md:block'}`}>
          <InlineText
            className={`${isMobile ? 'text-base' : 'text-base md:text-xl'} font-bold tracking-tighter uppercase text-zinc-100 block truncate`}
            value={brandData.menuLogoName}
            onSave={(val) => onUpdate({ menuLogoName: val })}
          />
          <InlineText
            tagName="p"
            className={`${isMobile ? 'text-[8px]' : 'text-[8px] md:text-[10px]'} text-zinc-500 tracking-[0.2em] font-medium leading-none block truncate`}
            value={brandData.menuTagline}
            onSave={(val) => onUpdate({ menuTagline: val })}
          />
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className={`${isMobile ? 'hidden' : 'hidden md:flex'} items-center gap-8 text-sm font-medium text-zinc-300`}>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key as any)}
            className={`hover:text-[var(--accent-light)] transition-colors ${activePage === item.key ? 'text-[var(--accent-light)] font-bold' : ''}`}
            style={{ fontFamily: 'var(--font-h1)', textDecoration: 'none' }}
          >
            <InlineText
              value={item.label}
              onSave={(val) => onUpdate({ navNames: { ...brandData.navNames, [item.key]: val } } as any)}
            />
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={handleSaveClick}
          className={`hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all uppercase border ${showSaveConfirm
            ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
            : hasUnsavedChanges
              ? 'bg-[var(--accent-dark)] text-white border-[var(--accent)] animate-pulse hover:animate-none hover:bg-[var(--accent)]'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
        >
          {showSaveConfirm ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              Saved!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              {hasUnsavedChanges ? 'Save' : 'Saved'}
            </>
          )}
        </button>

        <button
          onClick={onPublish}
          className="hidden md:flex items-center gap-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-[var(--accent)] px-4 py-1.5 rounded-full text-xs font-bold transition-all uppercase"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          PUBLISH
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden w-10 h-10 flex items-center justify-center text-[var(--accent)] hover:text-white transition-colors`}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <Portal>
          <div
            className={`fixed top-20 md:top-24 left-0 right-0 bottom-0 p-8 flex flex-col pt-8 gap-6 shadow-2xl animate-in slide-in-from-top-4 fade-in duration-500 z-[9999] md:hidden overflow-y-auto`}
            style={{
              backgroundColor: 'var(--menu-overlay-color, rgba(0,0,0,0.05))',
              backdropFilter: 'blur(var(--menu-overlay-blur, 5px)) brightness(var(--menu-overlay-brightness, 95%))',
              WebkitBackdropFilter: 'blur(var(--menu-overlay-blur, 5px)) brightness(var(--menu-overlay-brightness, 95%))'
            }}
          >
            <div className="flex flex-col pt-4">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => { onNavigate(item.key as any); setMobileMenuOpen(false); }}
                  className={`text-lg font-bold uppercase text-left py-4 border-b border-zinc-900/50 transition-colors ${activePage === item.key ? 'text-[var(--accent)]' : 'text-[var(--accent)]'}`}
                  style={{ fontFamily: 'var(--font-h1)' }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-4 pb-12">
              <button onClick={() => { onPublish(); setMobileMenuOpen(false); }} className="w-full border border-zinc-800 text-white py-4 rounded-full font-bold uppercase text-sm tracking-widest transition-all active:scale-95 bg-zinc-900/50">Publish Project</button>
              <button onClick={() => { onReset(); setMobileMenuOpen(false); }} className="w-full text-zinc-600 font-bold uppercase text-[10px] tracking-[0.3em] py-4">Reset Defaults</button>
            </div>
          </div>
        </Portal>
      )}
    </header>
  );
};

export default Header;
