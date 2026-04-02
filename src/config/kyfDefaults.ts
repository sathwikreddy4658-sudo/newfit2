// Default content for the Know Your Food page.
// These are the code-level fallback values.  When admin edits a card via the
// admin panel, the override is saved in Firestore (kyf_items collection) and
// the page uses that instead.  Deleting the Firestore document restores these
// defaults without requiring a code deploy.

export interface KYFDefaultSection {
  id: string;
  title: string;
  points: string[];
}

export interface KYFDefaultTerm {
  id: string;
  term: string;
  points: string[];
}

// ── How To Read A Food Pack ──────────────────────────────────────────────────
export const DEFAULT_SECTIONS: KYFDefaultSection[] = [
  {
    id: "nutrition",
    title: "Nutrition Information",
    points: [
      "The nutrition information panel shows the nutrients in the food product.",
      "This includes calories, fat, protein, carbohydrates, sugars, and sodium.",
      "Understanding these values helps you make informed dietary choices for your health.",
    ],
  },
  {
    id: "ingredients",
    title: "Ingredients List",
    points: [
      "Ingredients are listed by weight in a decreasing order. Top ingredients are used the most in that product.",
      "Reading this list helps you identify allergens, added sugars, and artificial additives.",
      "This helps you understand what exactly is in your food.",
    ],
  },
  {
    id: "claims",
    title: "Claims",
    points: [
      "Terms like 'sugar-free', 'low-fat', 'natural', and 'healthy' are marketing claims.",
      "Understanding what these terms actually mean helps you avoid misleading marketing.",
      "This helps you choose products that truly fit your needs.",
    ],
  },
  {
    id: "allergen",
    title: "Allergen Information",
    points: [
      "Allergen information identifies common allergens like milk, eggs, peanuts, tree nuts, fish, and shellfish.",
      "This is crucial for people with food allergies or sensitivities.",
      "It helps you avoid potentially harmful ingredients.",
    ],
  },
];

// ── Common Words On Food Packs ───────────────────────────────────────────────
export const DEFAULT_COMMON_WORDS: KYFDefaultTerm[] = [
  {
    id: "sugar-free",
    term: "Sugar-Free",
    points: [
      "Legally, a product can be called sugar-free only if total sugars are less than 0.5 g per 100 g.",
      "Here natural and added sugars both come under the total sugars.",
      "Always check the nutrition table to confirm.",
    ],
  },
  {
    id: "no-added-sugar",
    term: "No Added Sugar",
    points: [
      "Means no extra sugar was added during making.",
      "On the label, the \"Added Sugar\" value should show 0 g.",
      "However, natural sugars from other ingredients (like fruits or milk) may still be present.",
      "Important: Zero added sugar does not automatically mean it is suitable for people with diabetes.",
      "Suitability depends on the overall ingredients and nutrition values.",
    ],
  },
  {
    id: "unsweetened",
    term: "Unsweetened",
    points: [
      "Means no sugar or sweetener has been added for sweetness.",
      "However, natural sugars from ingredients (like milk or fruits) may still be present.",
    ],
  },
  {
    id: "guilt-free",
    term: "Guilt-Free / Healthy",
    points: [
      "These are marketing words.",
      "Many products use this term when they avoid white sugar, palm oil, maida, or certain ingredients.",
      "This does not automatically mean the product helps with weight loss or is suitable for people with diabetes.",
      "Always check the nutrition table and ingredients list.",
      "They do not automatically mean the product is healthy.",
    ],
  },
  {
    id: "gluten-free",
    term: "Gluten-Free",
    points: [
      "Made without gluten.",
      "Important for people with gluten allergy or intolerance.",
    ],
  },
  {
    id: "organic",
    term: "Organic",
    points: [
      "Made using organic farming methods.",
      "No synthetic fertilizers or pesticides.",
    ],
  },
  {
    id: "no-preservatives",
    term: "No Preservatives",
    points: [
      "Means no added preservatives are used.",
      "The product may still contain ingredients that naturally help preserve it.",
    ],
  },
  {
    id: "natural",
    term: "Natural / All Natural",
    points: [
      "Usually means ingredients come from natural sources.",
      "This term does not always have a strict legal definition.",
      "Always read the ingredients list.",
    ],
  },
];

// ── Ingredient Terms & Additives ─────────────────────────────────────────────
export const DEFAULT_INGREDIENT_TERMS: KYFDefaultTerm[] = [
  {
    id: "nature-identical-flavours",
    term: "Nature Identical Flavouring Substances",
    points: [
      "Flavours made to copy natural taste.",
      "These are artificial or synthetic flavours.",
    ],
  },
  {
    id: "ins-number",
    term: "INS Number",
    points: [
      "Code used for food additives.",
      "Depending on the number, it can mean preservatives, acidity regulators, sweeteners, colours, flavours, or stabilizers.",
    ],
  },
  {
    id: "acidity-regulators",
    term: "Acidity Regulators",
    points: [
      "Used to control sourness or acidity.",
      "Can be natural or synthetic.",
    ],
  },
  {
    id: "stabilizers",
    term: "Stabilizers",
    points: [
      "Help keep texture and consistency.",
      "Can be natural or synthetic.",
    ],
  },
];
