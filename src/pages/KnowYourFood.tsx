import mkbg from "@/assets/mkbg.png";
import pckbg from "@/assets/pckbg.png";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getKYFLinksForSection, getKYFItems, getINSDefinitions } from "@/integrations/firebase/db";
import { KYF_SECTIONS, getAllSectionIds } from "@/config/kyfSections";
import { INS_NUMBERS, type INSEntry } from "@/data/insNumbers";
import {
  DEFAULT_SECTIONS,
  DEFAULT_COMMON_WORDS,
  DEFAULT_INGREDIENT_TERMS,
} from "@/config/kyfDefaults";

interface KYFLink {
  id?: string;
  sectionId: string;
  subsectionId: string;
  title: string;
  url: string;
  order: number;
}

const KnowYourFood = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const [kyfLinks, setKyfLinks] = useState<Record<string, KYFLink[]>>({});
  const [loading, setLoading] = useState(true);

  // Content from DB (overrides code defaults)
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [commonWords, setCommonWords] = useState(DEFAULT_COMMON_WORDS);
  const [ingredientTerms, setIngredientTerms] = useState(DEFAULT_INGREDIENT_TERMS);
  const [insDefOverrides, setInsDefOverrides] = useState<Record<string, string>>({});

  // Main page search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // INS mini-search
  const [insQuery, setInsQuery] = useState("");
  const [insResults, setInsResults] = useState<INSEntry[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const insInputRef = useRef<HTMLInputElement>(null);

  // Handle tab change with URL update
  const handleTabChange = (tab: "general" | "ins") => {
    setSearchParams({ tab });
  };

  // Fetch admin-overridden content from Firestore (silent fail — code defaults remain)
  useEffect(() => {
    const fetchContentOverrides = async () => {
      try {
        const [dbItems, dbDefs] = await Promise.all([getKYFItems(), getINSDefinitions()]);

        if (dbItems.length > 0) {
          const overrideMap = new Map(dbItems.map(item => [item.itemId, item]));
          setSections(DEFAULT_SECTIONS.map(s => {
            const ov = overrideMap.get(s.id);
            return ov ? { ...s, title: ov.title, points: ov.points } : s;
          }));
          setCommonWords(DEFAULT_COMMON_WORDS.map(w => {
            const ov = overrideMap.get(w.id);
            return ov ? { ...w, term: ov.title, points: ov.points } : w;
          }));
          setIngredientTerms(DEFAULT_INGREDIENT_TERMS.map(t => {
            const ov = overrideMap.get(t.id);
            return ov ? { ...t, term: ov.title, points: ov.points } : t;
          }));
        }

        if (dbDefs.length > 0) {
          setInsDefOverrides(
            Object.fromEntries(dbDefs.map(d => [d.number, d.definition]))
          );
        }
      } catch (error) {
        console.error('[KYF] Failed to fetch content overrides:', error);
      }
    };
    fetchContentOverrides();
  }, []);

  // Fetch KYF links for all subsections dynamically
  useEffect(() => {
    const fetchAllLinks = async () => {
      try {
        setLoading(true);
        const allSectionIds = getAllSectionIds();
        const linksMap: Record<string, KYFLink[]> = {};

        // For each section, fetch all links and group by subsectionId
        for (const sectionId of allSectionIds) {
          try {
            const sectionLinks = await getKYFLinksForSection(sectionId);
            // Group by subsectionId
            sectionLinks.forEach(link => {
              if (!linksMap[link.subsectionId]) {
                linksMap[link.subsectionId] = [];
              }
              linksMap[link.subsectionId].push(link);
            });
          } catch (error) {
            console.error(`Error fetching links for section ${sectionId}:`, error);
          }
        }

        setKyfLinks(linksMap);
      } catch (error) {
        console.error("Error fetching KYF links:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLinks();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleTerm = (term: string) => {
    setExpandedTerms((prev) => {
      const newTerms = new Set(prev);
      if (newTerms.has(term)) {
        newTerms.delete(term);
      } else {
        newTerms.add(term);
      }
      return newTerms;
    });
  };

  // ── INS search handler ─────────────────────────────────────────────
  const handleInsSearch = useCallback((query: string) => {
    setInsQuery(query);
    const q = query.trim().toLowerCase();
    if (!q) {
      setInsResults([]);
      return;
    }
    const results = INS_NUMBERS.filter(
      (entry) =>
        entry.number.toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q)
    ).map(entry => ({
      ...entry,
      // DB definition overrides the code-level definition
      definition: insDefOverrides[entry.number] ?? entry.definition,
    }));
    setInsResults(results);
  }, [insDefOverrides]);

  // ── Build flat searchable index ───────────────────────────────────
  type SearchResult = {
    sectionLabel: string;
    sectionGroup: string;
    itemId: string;
    itemTitle: string;
    points: string[];
  };

  const allItems: SearchResult[] = [
    ...sections.map((s) => ({
      sectionLabel: "HOW TO READ A FOOD PACK",
      sectionGroup: "how-to-read",
      itemId: s.id,
      itemTitle: s.title,
      points: s.points,
    })),
    ...commonWords.map((w) => ({
      sectionLabel: "COMMON WORDS ON FOOD PACKS",
      sectionGroup: "common-words",
      itemId: w.id,
      itemTitle: w.term,
      points: w.points,
    })),
    ...ingredientTerms.map((t) => ({
      sectionLabel: "INGREDIENT TERMS & ADDITIVES",
      sectionGroup: "ingredient-terms",
      itemId: t.id,
      itemTitle: t.term,
      points: t.points,
    })),
  ];

  const searchResults: SearchResult[] = searchQuery.trim()
    ? (() => {
        const q = searchQuery.trim().toLowerCase();
        return allItems.filter(
          (item) =>
            item.itemTitle.toLowerCase().includes(q) ||
            item.sectionLabel.toLowerCase().includes(q) ||
            item.points.some((p) => p.toLowerCase().includes(q))
        );
      })()
    : [];

  const navigateToItem = (item: SearchResult) => {
    setSearchQuery("");
    if (item.sectionGroup === "how-to-read") {
      setExpandedSection(item.itemId);
    } else {
      setExpandedTerms((prev) => {
        const next = new Set(prev);
        next.add(item.itemId);
        return next;
      });
    }
    setTimeout(() => {
      const el = document.getElementById(`kyf-item-${item.itemId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-[#3b2a20]", "ring-offset-2");
        setTimeout(() => el.classList.remove("ring-2", "ring-[#3b2a20]", "ring-offset-2"), 2000);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed py-12" style={{
      backgroundImage: `url(${window.innerWidth < 768 ? mkbg : pckbg})`,
    }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Headline */}
        <div className="mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-saira font-black uppercase text-[#3b2a20]">
            KNOW YOUR <span style={{ color: '#3b2a20' }}>FOOD</span>
          </h1>
          <p className="text-lg md:text-xl font-poppins text-[#3b2a20] mt-2">
            Food labels and ingredients, explained simply.
          </p>
        </div>

        {/* ── Sticky Tabbed Search Interface ── */}
        <div className="sticky top-0 z-40 -mx-4 px-4 pt-4 pb-4 bg-gradient-to-b from-white via-white to-white/95 shadow-lg rounded-b-2xl mb-8">
          <div className="max-w-4xl mx-auto">
            {/* Tab Navigation - Brand Styled */}
            <div className="flex gap-3 mb-5 bg-white p-1 rounded-lg w-fit shadow-md border border-[#5e4338]">
              <button
                onClick={() => handleTabChange("general")}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm font-poppins transition-all duration-300 ${
                  activeTab === "general"
                    ? "bg-[#5e4338] text-white shadow-lg border border-[#5e4338]"
                    : "text-[#3b2a20]/70 hover:text-[#3b2a20] hover:bg-[#5e4338]/20"
                }`}
              >
                General Search
              </button>
              <button
                onClick={() => handleTabChange("ins")}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm font-poppins transition-all duration-300 ${
                  activeTab === "ins"
                    ? "bg-[#5e4338] text-white shadow-lg border border-[#5e4338]"
                    : "text-[#3b2a20]/70 hover:text-[#3b2a20] hover:bg-[#5e4338]/20"
                }`}
              >
                🔍 INS Lookup
              </button>
            </div>

            {/* General Search Tab */}
            {activeTab === "general" && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center bg-white rounded-xl border-2 border-[#5e4338] px-4 py-3 gap-3 shadow-lg">
                  <svg className="w-5 h-5 text-[#3b2a20] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                    placeholder="Search sections, terms, or definitions…"
                    className="flex-1 outline-none text-base font-poppins text-gray-800 placeholder-gray-400 bg-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* General search results dropdown */}
                {searchFocused && searchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl shadow-xl border-2 border-[#5e4338] max-h-80 overflow-y-auto mx-4">
                    {searchResults.length === 0 ? (
                      <div className="px-4 py-4 text-sm font-poppins text-gray-500">No results found for &ldquo;{searchQuery}&rdquo;</div>
                    ) : (
                      searchResults.map((result) => (
                        <button
                          key={`${result.sectionGroup}-${result.itemId}`}
                          onMouseDown={() => navigateToItem(result)}
                          className="w-full text-left px-4 py-3 hover:bg-[#5e4338]/30 transition-colors border-b border-[#5e4338]/30 last:border-b-0"
                        >
                          <div className="text-xs font-semibold font-poppins text-[#3b2a20] uppercase tracking-wide mb-0.5">
                            {result.sectionLabel}
                          </div>
                          <div className="text-sm font-poppins font-semibold text-[#3b2a20]">{result.itemTitle}</div>
                          {result.points.map((p, i) => {
                            const q = searchQuery.trim().toLowerCase();
                            if (p.toLowerCase().includes(q) && !result.itemTitle.toLowerCase().includes(q)) {
                              return (
                                <div key={i} className="text-xs font-poppins text-gray-600 mt-0.5 truncate">
                                  {p}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* INS Search Tab */}
            {activeTab === "ins" && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center bg-white rounded-xl border-2 border-[#5e4338] px-4 py-3 gap-3 shadow-lg">
                  <svg className="w-5 h-5 text-[#3b2a20] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref={insInputRef}
                    type="text"
                    value={insQuery}
                    onChange={(e) => handleInsSearch(e.target.value)}
                    placeholder="Enter INS number (e.g., E101) or additive name…"
                    className="flex-1 outline-none text-base font-poppins text-gray-800 placeholder-gray-400 bg-transparent"
                  />
                  {insQuery && (
                    <button
                      onClick={() => { setInsQuery(""); setInsResults([]); }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* INS results */}
                {insQuery.trim() && (
                  <div className="mt-4">
                    {insResults.length === 0 ? (
                      <p className="text-sm font-poppins text-gray-500 px-2">No matching INS entry found. Try searching like "E101" or "Thiamine".</p>
                    ) : (
                      <div className="rounded-xl border border-[#5e4338] overflow-hidden max-h-64 overflow-y-auto bg-white shadow-lg">
                        {insResults.map((entry, i) => (
                          <div
                            key={entry.number}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-[#5e4338]/30 last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-[#5e4338]/5"}`}
                          >
                            <span className="text-base font-bold font-poppins text-[#3b2a20] w-16 shrink-0">
                              {entry.number}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-base font-poppins text-gray-800 font-medium">{entry.name}</span>
                              <span className="text-xs font-poppins text-[#5e4338] font-semibold">{entry.category}</span>
                              {entry.definition && (
                                <span className="text-xs font-poppins text-gray-600 mt-1 leading-relaxed">{entry.definition}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How to Read Section */}
      <div className="max-w-4xl mx-auto px-4 mt-16">
        <h2 className="text-3xl sm:text-4xl font-saira font-black uppercase text-[#3b2a20] mb-8 px-3 py-2 rounded w-fit" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
          HOW TO READ A FOOD PACK
        </h2>

        {/* Accordion Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <div
              key={section.id}
              id={`kyf-item-${section.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 cursor-pointer transition-all duration-300"
              onClick={() => toggleSection(section.id)}
            >
              {/* Header */}
              <div className="p-4 md:p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <h3 className="text-lg md:text-xl font-saira font-bold text-[#3b2a20] px-3 py-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                  {section.title}
                </h3>
                <span className="text-2xl text-[#3b2a20] transition-transform duration-300" style={{
                  transform: expandedSection === section.id ? 'rotate(45deg)' : 'rotate(0deg)'
                }}>
                  +
                </span>
              </div>

              {/* Content */}
              {expandedSection === section.id && (
                <div className="border-t border-gray-200 px-4 md:px-5 py-4 bg-gray-50 animate-in fade-in duration-300">
                  <ul className="space-y-2">
                    {section.points.map((point, index) => (
                      <li key={index} className="text-black font-poppins text-base flex items-start">
                        <span className="mr-3">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Display KYF Links if available */}
                  {kyfLinks[section.id] && kyfLinks[section.id].length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-sm font-semibold text-[#3b2a20] mb-2">Learn more:</p>
                      <div className="flex flex-col gap-2">
                        {kyfLinks[section.id].map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-poppins break-words"
                          >
                            → {link.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Common Words Section */}
      <div className="max-w-4xl mx-auto px-4 mt-16">
        <h2 className="text-3xl sm:text-4xl font-saira font-black uppercase text-[#3b2a20] mb-8 px-3 py-2 rounded w-fit" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
          COMMON WORDS ON FOOD PACKS
        </h2>

        {/* Term Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commonWords.map((word) => (
            <div
              key={word.id}
              id={`kyf-item-${word.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 cursor-pointer transition-all duration-300"
              onClick={() => toggleTerm(word.id)}
            >
              {/* Header */}
              <div className="p-4 md:p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <h3 className="text-lg md:text-xl font-saira font-bold text-[#3b2a20] px-3 py-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                  {word.term}
                </h3>
                <span className="text-2xl text-[#3b2a20] transition-transform duration-300" style={{
                  transform: expandedTerms.has(word.id) ? 'rotate(45deg)' : 'rotate(0deg)'
                }}>
                  +
                </span>
              </div>

              {/* Content */}
              {expandedTerms.has(word.id) && (
                <div className="border-t border-gray-200 px-4 md:px-5 py-4 bg-gray-50 animate-in fade-in duration-300">
                  <ul className="space-y-2">
                    {word.points.map((point, index) => (
                      <li key={index} className="text-black font-poppins text-base flex items-start">
                        <span className="mr-3">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Display KYF Links if available */}
                  {kyfLinks[word.id] && kyfLinks[word.id].length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-sm font-semibold text-[#3b2a20] mb-2">Learn more:</p>
                      <div className="flex flex-col gap-2">
                        {kyfLinks[word.id].map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-poppins break-words"
                          >
                            → {link.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ingredient Terms Section */}
      <div className="max-w-4xl mx-auto px-4 mt-16">
        <h2 className="text-3xl sm:text-4xl font-saira font-black uppercase text-[#3b2a20] mb-8 px-3 py-2 rounded w-fit" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
          INGREDIENT TERMS & ADDITIVES
        </h2>

        {/* Term Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ingredientTerms.map((term) => (
            <div
              key={term.id}
              id={`kyf-item-${term.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 cursor-pointer transition-all duration-300"
              onClick={() => toggleTerm(term.id)}
            >
              {/* Header */}
              <div className="p-4 md:p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <h3 className="text-lg md:text-xl font-saira font-bold text-[#3b2a20] px-3 py-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                  {term.term}
                </h3>
                <span className="text-2xl text-[#3b2a20] transition-transform duration-300" style={{
                  transform: expandedTerms.has(term.id) ? 'rotate(45deg)' : 'rotate(0deg)'
                }}>
                  +
                </span>
              </div>

              {/* Content */}
              {expandedTerms.has(term.id) && (
                <div className="border-t border-gray-200 px-4 md:px-5 py-4 bg-gray-50 animate-in fade-in duration-300">
                  <ul className="space-y-2">
                    {term.points.map((point, index) => (
                      <li key={index} className="text-black font-poppins text-base flex items-start">
                        <span className="mr-3">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Display KYF Links if available */}
                  {kyfLinks[term.id] && kyfLinks[term.id].length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-sm font-semibold text-[#3b2a20] mb-2">Learn more:</p>
                      <div className="flex flex-col gap-2">
                        {kyfLinks[term.id].map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-poppins break-words"
                          >
                            → {link.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* What Labels Can & Can't Tell You Section */}
      <div className="max-w-4xl mx-auto px-4 mt-16">
        <h2 className="text-3xl sm:text-4xl font-saira font-black uppercase text-[#3b2a20] mb-8 px-3 py-2 rounded w-fit" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
          WHAT LABELS CAN & CAN'T TELL YOU
        </h2>

        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 p-6">
          <ul className="space-y-3">
            <li className="text-black font-poppins text-base flex items-start">
              <span className="mr-3">•</span>
              <span>Food labels summarise information about a product.</span>
            </li>
            <li className="text-black font-poppins text-base flex items-start">
              <span className="mr-3">•</span>
              <span>They help you compare and understand food better.</span>
            </li>
            <li className="text-black font-poppins text-base flex items-start">
              <span className="mr-3">•</span>
              <span>For deeper verification, testing and asking questions matters.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KnowYourFood;
