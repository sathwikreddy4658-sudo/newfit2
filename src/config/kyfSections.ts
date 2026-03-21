// Centralized KYF sections and subsections configuration
// Update this file when adding or modifying KYF sections/subsections

export interface KYFSubsection {
  id: string;
  name: string;
}

export interface KYFSection {
  id: string;
  name: string;
  subsections: KYFSubsection[];
}

export const KYF_SECTIONS: KYFSection[] = [
  {
    id: "how-to-read",
    name: "HOW TO READ A FOOD PACK",
    subsections: [
      { id: "nutrition", name: "Nutrition Information" },
      { id: "ingredients", name: "Ingredients List" },
      { id: "claims", name: "Claims" },
      { id: "allergen", name: "Allergen Information" },
    ],
  },
  {
    id: "common-words",
    name: "COMMON WORDS ON FOOD PACKS",
    subsections: [
      { id: "sugar-free", name: "Sugar-Free" },
      { id: "no-added-sugar", name: "No Added Sugar" },
      { id: "unsweetened", name: "Unsweetened" },
      { id: "guilt-free", name: "Guilt-Free / Healthy" },
      { id: "gluten-free", name: "Gluten-Free" },
      { id: "organic", name: "Organic" },
      { id: "no-preservatives", name: "No Preservatives" },
      { id: "natural", name: "Natural / All Natural" },
    ],
  },
  {
    id: "ingredient-terms",
    name: "INGREDIENT TERMS & ADDITIVES",
    subsections: [
      { id: "nature-identical", name: "Nature Identical Flavouring Substances" },
      { id: "ins-number", name: "INS Number" },
      { id: "acidity-regulators", name: "Acidity Regulators" },
      { id: "stabilizers", name: "Stabilizers" },
    ],
  },
];

// Helper functions to get all IDs dynamically
export function getAllSectionIds(): string[] {
  return KYF_SECTIONS.map(s => s.id);
}

export function getAllSubsectionIds(): string[] {
  return KYF_SECTIONS.flatMap(s => s.subsections.map(sub => sub.id));
}

export function getSubsectionsBySection(sectionId: string): KYFSubsection[] {
  const section = KYF_SECTIONS.find(s => s.id === sectionId);
  return section?.subsections || [];
}

export function getSectionName(sectionId: string): string {
  const section = KYF_SECTIONS.find(s => s.id === sectionId);
  return section?.name || sectionId;
}

export function getSubsectionName(subsectionId: string): string {
  for (const section of KYF_SECTIONS) {
    const subsection = section.subsections.find(s => s.id === subsectionId);
    if (subsection) return subsection.name;
  }
  return subsectionId;
}
