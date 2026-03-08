
import React, { useState } from 'react';
import { BrandState, ToneType, TONE_VALUES } from '../types';
import { GoogleGenerativeAI as GoogleGenAI } from "@google/generative-ai";

interface EditorProps {
  brandData: BrandState;
  onUpdate: (newData: Partial<BrandState>) => void;
  activePage: 'home' | 'about' | 'contact';
}

const Editor: React.FC<EditorProps> = ({ brandData, onUpdate, activePage }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeVideoUrl = activePage === 'home' ? brandData.sections.home.hero.videoUrl :
    activePage === 'about' ? brandData.sections.about.hero.videoUrl :
      brandData.sections.contact.videoUrl;

  const handleAISuggestion = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      if (!import.meta.env.VITE_API_KEY) {
        throw new Error("API Key is missing. Cannot generate content.");
      }

      let contents = "";
      let responseSchema: any = {};

      if (activePage === 'about') {
        contents = `Refine the "About Us" content for ${brandData.companyName}. 
        User Request: ${prompt || "Make it more professional and resilient."}
        Current Tagline: ${brandData.sections.about.story.tagline}
        Current Story: ${brandData.sections.about.story.text}
        Current Mission: ${brandData.sections.about.mission.text}
        Selected Tone: ${brandData.tone}`;

        responseSchema = {
          type: "object",
          properties: {
            tagline: { type: "string" },
            story: { type: "string" },
            mission: { type: "string" },
          },
          required: ["tagline", "story", "mission"]
        };
      } else if (activePage === 'home') {
        contents = `Create catchy "Home Page" headlines and "Origin" section descriptions for ${brandData.companyName}.
        User Request: ${prompt || "Make it bold and impactful."}
        Current Headline: ${brandData.sections.home.hero.headline}
        Current Subheadline: ${brandData.sections.home.hero.subheadline}
        Current Origin Headline: ${brandData.sections.home.origin.headline}
        Current Origin Description: ${brandData.sections.home.origin.text}
        Selected Tone: ${brandData.tone}`;

        responseSchema = {
          type: "object",
          properties: {
            homeHeadline: { type: "string" },
            homeSubheadline: { type: "string" },
            homeOriginHeadline: { type: "string" },
            homeOriginDescription: { type: "string" },
            homeCtaText: { type: "string" }
          },
          required: ["homeHeadline", "homeSubheadline", "homeOriginHeadline", "homeOriginDescription", "homeCtaText"]
        };
      } else {
        // Contact
        contents = `Create inviting "Contact Page" copy for ${brandData.companyName}.
        User Request: ${prompt || "Make it welcoming yet mysterious."}
        Current Headline: ${brandData.sections.contact.headline}
        Current Text: ${brandData.sections.contact.text}
        Selected Tone: ${brandData.tone}`;

        responseSchema = {
          type: "object",
          properties: {
            contactHeadline: { type: "string" },
            contactText: { type: "string" }
          },
          required: ["contactHeadline", "contactText"]
        };
      }

      const genAI = new GoogleGenAI(import.meta.env.VITE_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash-latest',
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });

      const response = await model.generateContent(contents);
      const responseText = response.response.text();

      if (!responseText) {
        throw new Error("Received empty response from AI.");
      }

      const result = JSON.parse(responseText.trim());

      // Transform flat AI result to nested BrandState updates
      if (activePage === 'about') {
        onUpdate({
          sections: {
            ...brandData.sections,
            about: {
              ...brandData.sections.about,
              story: { ...brandData.sections.about.story, tagline: result.tagline, text: result.story },
              mission: { ...brandData.sections.about.mission, text: result.mission }
            }
          }
        } as any);
      } else if (activePage === 'home') {
        onUpdate({
          sections: {
            ...brandData.sections,
            home: {
              ...brandData.sections.home,
              hero: { ...brandData.sections.home.hero, headline: result.homeHeadline, subheadline: result.homeSubheadline, ctaText: result.homeCtaText },
              origin: { ...brandData.sections.home.origin, headline: result.homeOriginHeadline, text: result.homeOriginDescription }
            }
          }
        } as any);
      } else {
        onUpdate({
          sections: {
            ...brandData.sections,
            contact: { ...brandData.sections.contact, headline: result.contactHeadline, text: result.contactText }
          }
        } as any);
      }

      setPrompt("");
    } catch (error: any) {
      console.error("Gemini failed:", error);
      setError(error.message || "Failed to refine content.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold capitalize">{activePage} Page Tuner</h3>
          <p className="text-zinc-500 text-sm">Fine-tune your {activePage} content with Gemini.</p>
        </div>
        <div className="hidden md:block">
          <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-bold text-zinc-400">GEMINI POWERED</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Company Name</label>
            <input
              value={brandData.companyName}
              onChange={(e) => onUpdate({ companyName: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>

          {activePage === 'home' && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Main Headline</label>
                <input
                  value={brandData.sections.home.hero.headline}
                  onChange={(e) => onUpdate({ sections: { ...brandData.sections, home: { ...brandData.sections.home, hero: { ...brandData.sections.home.hero, headline: e.target.value } } } } as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Origin Headline</label>
                <input
                  value={brandData.sections.home.origin.headline}
                  onChange={(e) => onUpdate({ sections: { ...brandData.sections, home: { ...brandData.sections.home, origin: { ...brandData.sections.home.origin, headline: e.target.value } } } } as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors font-bold"
                />
              </div>
            </>
          )}

          {activePage === 'about' && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Tagline</label>
              <input
                value={brandData.sections.about.story.tagline}
                onChange={(e) => onUpdate({ sections: { ...brandData.sections, about: { ...brandData.sections.about, story: { ...brandData.sections.about.story, tagline: e.target.value } } } } as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>
          )}

          {activePage === 'contact' && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Contact Headline</label>
              <input
                value={brandData.sections.contact.headline}
                onChange={(e) => onUpdate({ sections: { ...brandData.sections, contact: { ...brandData.sections.contact, headline: e.target.value } } } as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Voice Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {TONE_VALUES.map(t => (
                <button
                  key={t}
                  onClick={() => onUpdate({ tone: t })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${brandData.tone === t
                    ? 'bg-[var(--accent-dark)] border-[var(--accent)] text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {activePage === 'home' && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Subheadline</label>
                <textarea
                  rows={2}
                  value={brandData.sections.home.hero.subheadline}
                  onChange={(e) => onUpdate({ sections: { ...brandData.sections, home: { ...brandData.sections.home, hero: { ...brandData.sections.home.hero, subheadline: e.target.value } } } } as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors resize-none text-sm leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Origin Description</label>
                <textarea
                  rows={3}
                  value={brandData.sections.home.origin.text}
                  onChange={(e) => onUpdate({ sections: { ...brandData.sections, home: { ...brandData.sections.home, origin: { ...brandData.sections.home.origin, text: e.target.value } } } } as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors resize-none text-sm leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">CTA Button Text</label>
                <input
                  value={brandData.sections.home.hero.ctaText}
                  onChange={(e) => onUpdate({ sections: { ...brandData.sections, home: { ...brandData.sections.home, hero: { ...brandData.sections.home.hero, ctaText: e.target.value } } } } as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors"
                />
              </div>
            </>
          )}

          {activePage === 'about' && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">The Story</label>
                <textarea
                  rows={4}
                  value={brandData.sections.about.story.text}
                  onChange={(e) => onUpdate({ sections: { ...brandData.sections, about: { ...brandData.sections.about, story: { ...brandData.sections.about.story, text: e.target.value } } } } as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors resize-none text-sm leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">The Mission</label>
                <textarea
                  rows={2}
                  value={brandData.sections.about.mission.text}
                  onChange={(e) => onUpdate({ sections: { ...brandData.sections, about: { ...brandData.sections.about, mission: { ...brandData.sections.about.mission, text: e.target.value } } } } as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors resize-none text-sm leading-relaxed"
                />
              </div>
            </>
          )}

          {activePage === 'contact' && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Intro Text</label>
                <textarea
                  rows={4}
                  value={brandData.sections.contact.text}
                  onChange={(e) => onUpdate({ sections: { ...brandData.sections, contact: { ...brandData.sections.contact, text: e.target.value } } } as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors resize-none text-sm leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Primary Email</label>
                <input
                  value={brandData.sections.contact.email}
                  onChange={(e) => onUpdate({ sections: { ...brandData.sections, contact: { ...brandData.sections.contact, email: e.target.value } } } as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-800">
        <h4 className="text-sm font-bold text-zinc-400 mb-6 uppercase tracking-widest">Visual Assets</h4>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Hero Video URL ({activePage})</label>
            <input
              value={activeVideoUrl}
              onChange={(e) => {
                const val = e.target.value;
                if (activePage === 'home') onUpdate({ sections: { ...brandData.sections, home: { ...brandData.sections.home, hero: { ...brandData.sections.home.hero, videoUrl: val } } } } as any);
                else if (activePage === 'about') onUpdate({ sections: { ...brandData.sections, about: { ...brandData.sections.about, hero: { ...brandData.sections.about.hero, videoUrl: val } } } } as any);
                else onUpdate({ sections: { ...brandData.sections, contact: { ...brandData.sections.contact, videoUrl: val } } } as any);
              }}
              placeholder="https://..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors text-sm text-zinc-400"
            />
            <p className="text-[10px] text-zinc-600 mt-1">Video is unique to this page.</p>
          </div>
          {activePage === 'about' && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Story Image URL</label>
              <input
                value={brandData.sections.about.story.imageUrl}
                onChange={(e) => onUpdate({ sections: { ...brandData.sections, about: { ...brandData.sections.about, story: { ...brandData.sections.about.story, imageUrl: e.target.value } } } } as any)}
                placeholder="https://..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors text-sm text-zinc-400"
              />
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-800">
        <div className={`bg-zinc-950 p-4 rounded-xl border ${error ? 'border-red-500/50' : 'border-zinc-800'} shadow-inner transition-colors`}>
          <div className="flex justify-between mb-3">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Refine {activePage} content with AI</label>
            {error && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</span>}
          </div>
          <div className="flex gap-2">
            <input
              placeholder={`e.g. Make the ${activePage} text more ${brandData.tone.toLowerCase()}...`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:border-[var(--accent)] outline-none transition-colors text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAISuggestion()}
            />
            <button
              onClick={handleAISuggestion}
              disabled={isGenerating}
              className="bg-[var(--accent-dark)] hover:bg-[var(--accent)] disabled:bg-zinc-800 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Tuning...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="white" />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
