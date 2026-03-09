/**
 * src/publish/ssr.ts
 *
 * React SSR renderer for published pages.
 * Uses renderToStaticMarkup so the same React components that power
 * the editor also generate the published HTML — parity is guaranteed
 * by construction. No more dual-system maintenance.
 *
 * Returns an HTML string for the page BODY only.
 * The generator wraps this in a full HTML document with <head>, CSS and JS.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrandState } from '../types';
import { HeroSection } from '../components/HeroSection';
import { OriginSection } from '../components/OriginSection';
import { LiveSection } from '../components/LiveSection';
import { MediaGallerySection } from '../components/MediaGallerySection';
import { FooterSection } from '../components/FooterSection';
import { ContactSection } from '../components/ContactSection';
import { AboutHeroSection } from '../components/AboutHeroSection';
import { AboutStorySection } from '../components/AboutStorySection';
import { AboutMissionSection } from '../components/AboutMissionSection';
import { GlobalFooter } from '../components/GlobalFooter';

export type PageKey = 'home' | 'about' | 'contact';

/** No-op update handler — sections need it in their prop interface but publish mode never calls it. */
const noop = () => {};

/** SSR-safe brandData: forces desktop mode (mobile handled by CSS). */
const publishBrand = (brandData: BrandState): BrandState => ({
  ...brandData,
  isMobilePreview: false,
});

// ── Published navigation bar ──────────────────────────────────────────────────

interface NavProps {
  brandData: BrandState;
  page: PageKey;
}

const PublishNav: React.FC<NavProps> = ({ brandData, page }) => {
  const vis = brandData.pageVisibility;
  const names = brandData.navNames;

  // Header background — mirrors generator.ts getHeaderBg logic
  const opacity = brandData.menuOpacity ?? 0.4;
  const tintColor = brandData.menuTintColor || brandData.accentColor || '#000000';
  const tintAmount = brandData.menuTintAmount ?? 0.1;
  const rgb = tintColor.replace('#', '').match(/.{2}/g)?.map(h => parseInt(h, 16)) ?? [0, 0, 0];
  const headerBg = `rgba(${Math.round(rgb[0] * tintAmount + 10)}, ${Math.round(rgb[1] * tintAmount + 10)}, ${Math.round(rgb[2] * tintAmount + 10)}, ${opacity})`;

  const linkCls = (active: boolean) =>
    `text-sm font-medium transition-colors ${active
      ? 'text-[var(--accent-light)] font-bold'
      : 'text-zinc-300 hover:text-[var(--accent-light)]'}`;

  return React.createElement('header', {
    id: 'main-header',
    style: { backgroundColor: headerBg },
    className: 'fixed top-0 left-0 right-0 z-50 backdrop-blur-3xl flex items-center justify-between shadow-lg shadow-black/20 h-24 px-8'
  },
    // Logo
    React.createElement('a', {
      href: 'index.html',
      className: 'text-white font-bold text-xl tracking-widest uppercase no-underline hover:text-[var(--accent-light)] transition-colors'
    }, brandData.companyName),

    // Desktop nav
    React.createElement('nav', { className: 'hidden md:flex items-center gap-8' },
      React.createElement('a', { href: 'index.html', className: linkCls(page === 'home') }, names.home || 'Home'),
      vis?.about !== false && React.createElement('a', { href: 'about.html', className: linkCls(page === 'about') }, names.about || 'About'),
      vis?.contact !== false && React.createElement('a', { href: 'contact.html', className: linkCls(page === 'contact') }, names.contact || 'Contact'),
      vis?.epk && React.createElement('a', { href: 'epk.html', className: linkCls(false) }, names.epk || 'EPK'),
    ),

    // Hamburger (mobile — JS-driven)
    React.createElement('button', {
      'aria-label': 'Open menu',
      'aria-expanded': 'false',
      'aria-controls': 'mobile-menu',
      className: 'md:hidden w-10 h-10 flex items-center justify-center text-[var(--accent)]',
      onClick: undefined
    },
      React.createElement('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
        React.createElement('line', { x1: 3, y1: 6, x2: 21, y2: 6 }),
        React.createElement('line', { x1: 3, y1: 12, x2: 21, y2: 12 }),
        React.createElement('line', { x1: 3, y1: 18, x2: 21, y2: 18 }),
      )
    )
  );
};

// ── Page element trees ────────────────────────────────────────────────────────

function homePage(brandData: BrandState): React.ReactElement {
  const d = publishBrand(brandData);
  return React.createElement(React.Fragment, null,
    React.createElement(PublishNav, { brandData: d, page: 'home' }),
    React.createElement('main', null,
      React.createElement(HeroSection, {
        brandData: d, onUpdate: noop, scrollY: 0, mode: 'publish'
      }),
      React.createElement(OriginSection, {
        brandData: d, onUpdate: noop, onNavigate: noop as any, scrollY: 0, mode: 'publish'
      }),
      React.createElement(LiveSection, {
        brandData: d, onUpdate: noop, scrollY: 0, mode: 'publish'
      }),
      React.createElement(MediaGallerySection, {
        brandData: d, onUpdate: noop, mode: 'publish'
      }),
      React.createElement(FooterSection, {
        brandData: d, onUpdate: noop, scrollY: 0, mode: 'publish'
      }),
    ),
    React.createElement(GlobalFooter, { brandData: d }),
  );
}

function aboutPage(brandData: BrandState): React.ReactElement {
  const d = publishBrand(brandData);
  return React.createElement(React.Fragment, null,
    React.createElement(PublishNav, { brandData: d, page: 'about' }),
    React.createElement('main', null,
      React.createElement(AboutHeroSection, {
        brandData: d, onUpdate: noop, scrollY: 0, mode: 'publish'
      }),
      React.createElement(AboutStorySection, {
        brandData: d, onUpdate: noop, scrollY: 0, mode: 'publish'
      }),
      React.createElement(AboutMissionSection, {
        brandData: d, onUpdate: noop, mode: 'publish'
      }),
    ),
    React.createElement(GlobalFooter, { brandData: d }),
  );
}

function contactPage(brandData: BrandState): React.ReactElement {
  const d = publishBrand(brandData);
  return React.createElement(React.Fragment, null,
    React.createElement(PublishNav, { brandData: d, page: 'contact' }),
    React.createElement('main', null,
      React.createElement(ContactSection, {
        brandData: d, onUpdate: noop, scrollY: 0, mode: 'publish'
      }),
    ),
    React.createElement(GlobalFooter, { brandData: d }),
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render a page to a static HTML string.
 * Returns only the body content — no <html>, <head>, CSS or JS.
 * The caller (generator.ts) assembles the full HTML document.
 */
export function renderPageBody(page: PageKey, brandData: BrandState): string {
  let element: React.ReactElement;
  switch (page) {
    case 'home':    element = homePage(brandData);    break;
    case 'about':   element = aboutPage(brandData);   break;
    case 'contact': element = contactPage(brandData); break;
    default:
      throw new Error(`renderPageBody: unknown page "${page}"`);
  }
  return renderToStaticMarkup(element);
}
