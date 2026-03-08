
import React, { useState, useEffect, useRef } from 'react';
import { ProjectState } from '../types';

interface InlineTextProps {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  multiline?: boolean;
  styleKey?: string;
  brandData?: ProjectState;
  mode?: 'edit' | 'publish';
}

export const InlineText: React.FC<InlineTextProps> = ({
  value,
  onSave,
  className = '',
  tagName = 'span',
  multiline = false,
  styleKey,
  brandData,
  mode = 'edit'
}) => {
  const isPublish = mode === 'publish';
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);


  // Glitch Effect Logic
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
  };

  const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);

  // Resolve per-element styles
  // Resolve per-element styles
  const styles = styleKey && brandData?.textStyles?.[styleKey] ? brandData.textStyles[styleKey] : {};
  const customFont = styles.font;
  const customScale = styles.scale || 1.0;
  const customClasses = styles.classes || '';
  const customColor = styles.color;
  const customAccent = styles.accent;

  // Logic: "semanticType" overrides the tag default.
  // e.g. If specific override is 'h3', we use H3 font var and H3 sizing logic.
  const resolvedType = styles.semanticType || tagName;
  const isResolvedHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(resolvedType);

  const getFontVar = () => {
    if (customFont) return customFont;
    if (styles.semanticType) return `var(--font-${styles.semanticType})`;

    if (tagName === 'h1') return 'var(--font-h1)';
    if (tagName === 'h2') return 'var(--font-h2)';
    if (tagName === 'h3') return 'var(--font-h3)';
    if (tagName === 'h4') return 'var(--font-h4)';
    if (tagName === 'h5') return 'var(--font-h5)';
    if (tagName === 'h6') return 'var(--font-h6)';
    if (isHeading) return 'var(--font-heading)';
    return 'var(--font-body)';
  };

  // Map semanticType / tagName to the fluid CSS variable
  const getSemanticFsVar = (): string => {
    const t = styles.semanticType || tagName;
    switch (t) {
      case 'h1': return 'var(--fs-display)';
      case 'h2': return 'var(--fs-h1)';
      case 'h3': return 'var(--fs-h2)';
      case 'h4': return 'var(--fs-h3)';
      case 'h5': return 'var(--fs-h4)';
      case 'h6': return 'var(--fs-h5)';
      case 'body': return 'var(--fs-body)';
      default: return isHeading ? 'var(--fs-display)' : 'var(--fs-body)';
    }
  };

  const computeFontSize = (): string => {
    if (styles.customSize) return styles.customSize;
    return `calc(${getSemanticFsVar()} * ${customScale})`;
  };

  const inlineStyle: React.CSSProperties = {
    fontFamily: getFontVar(),
    fontSize: computeFontSize(),
    color: customColor || undefined,
    ...(customAccent && { '--accent': customAccent } as any),
  };

  if (isEditing && !isPublish) {
    const commonClasses = `bg-zinc-900/90 text-white outline-none border-b-2 border-[var(--accent)] w-full rounded px-2 py-1 shadow-xl ${className} ${customClasses}`;
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onSave(e.target.value)}
          onBlur={handleBlur}
          className={commonClasses}
          rows={(value.match(/\n/g) || []).length + 3}
          style={inlineStyle}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={value}
        onChange={(e) => onSave(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={commonClasses}
        style={inlineStyle}
      />
    );
  }



  const getEffectiveClasses = () => {
    let base = `${className} ${customClasses}`;

    // Line Height
    if (styles.lineHeight) {
      // Remove any existing leading- classes from the base strings to prevent conflicts
      base = base.replace(/\bleading-[a-z]+\b/g, '').trim();
      base += ` leading-${styles.lineHeight}`;
    }

    // Glitch FX
    if (styles.glitchEnabled === false) {
      base = base.replace('glitch-heading', '').trim();
    } else if (styles.glitchEnabled === true && !base.includes('glitch-heading')) {
      base += ' glitch-heading';
    }

    return base;
  };

  const finalClasses = getEffectiveClasses();
  const hasGlitchClass = finalClasses.includes('glitch-heading');

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (hasGlitchClass) {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 200);
    }
  };

  const Tag = tagName as any;

  if (isPublish) {
    return (
      <Tag
        className={`${finalClasses} ${isGlitching ? 'glitch-active' : ''}`}
        data-text={value}
        style={inlineStyle}
      >
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      onMouseEnter={handleMouseEnter}
      className={`${finalClasses} ${isGlitching ? 'glitch-active' : ''} cursor-text hover:bg-white/10 hover:ring-2 hover:ring-[rgb(var(--accent-rgb)/0.5)] rounded px-1 -mx-1 transition-all duration-200 relative`}
      title="Click to edit"
      data-text={value}
      style={inlineStyle}
    >
      {value}
    </Tag>
  );
};
