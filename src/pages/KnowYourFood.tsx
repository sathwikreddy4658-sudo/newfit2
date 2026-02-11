import mkbg from "@/assets/mkbg.png";
import pckbg from "@/assets/pckbg.png";
import { useState } from "react";

const KnowYourFood = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

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

  const sections = [
    {
      id: "nutrition",
      title: "Nutrition Information",
      points: [
        "The nutrition information panel shows the nutrients in the food product.",
        "This includes calories, fat, protein, carbohydrates, sugars, and sodium.",
        "Understanding these values helps you make informed dietary choices for your health."
      ]
    },
    {
      id: "ingredients",
      title: "Ingredients List",
      points: [
        "Ingredients are listed by weight in a decreasing order. Top ingredients are used the most in that product.",
        "Reading this list helps you identify allergens, added sugars, and artificial additives.",
        "This helps you understand what exactly is in your food."
      ]
    },
    {
      id: "claims",
      title: "Claims",
      points: [
        "Terms like 'sugar-free', 'low-fat', 'natural', and 'healthy' are marketing claims.",
        "Understanding what these terms actually mean helps you avoid misleading marketing.",
        "This helps you choose products that truly fit your needs."
      ]
    },
    {
      id: "allergen",
      title: "Allergen Information",
      points: [
        "Allergen information identifies common allergens like milk, eggs, peanuts, tree nuts, fish, and shellfish.",
        "This is crucial for people with food allergies or sensitivities.",
        "It helps you avoid potentially harmful ingredients."
      ]
    }
  ];

  const commonWords = [
    {
      id: "sugar-free",
      term: "Sugar-Free",
      points: [
        "Legally, a product can be called sugar-free only if total sugars are less than 0.5 g per 100 g.",
        "Here natural and added sugars both come under the total sugars.",
        "Always check the nutrition table to confirm."
      ]
    },
    {
      id: "no-added-sugar",
      term: "No Added Sugar",
      points: [
        "Means no extra sugar was added during making.",
        "On the label, the \"Added Sugar\" value should show 0 g.",
        "However, natural sugars from other ingredients (like fruits or milk) may still be present.",
        "Important: Zero added sugar does not automatically mean it is suitable for people with diabetes.",
        "Suitability depends on the overall ingredients and nutrition values."
      ]
    },
    {
      id: "unsweetened",
      term: "Unsweetened",
      points: [
        "Means no sugar or sweetener has been added for sweetness.",
        "However, natural sugars from ingredients (like milk or fruits) may still be present."
      ]
    },
    {
      id: "guilt-free",
      term: "Guilt-Free / Healthy",
      points: [
        "These are marketing words.",
        "Many products use this term when they avoid white sugar, palm oil, maida, or certain ingredients.",
"This does not automatically mean the product helps with weight loss or is suitable for people with diabetes.",
"Always check the nutrition table and ingredients list.",
"They do not automatically mean the product is healthy."
      ]
    },
    {
      id: "gluten-free",
      term: "Gluten-Free",
      points: [
        "Made without gluten.",
        "Important for people with gluten allergy or intolerance."
      ]
    },
    {
      id: "organic",
      term: "Organic",
      points: [
        "Made using organic farming methods.",
        "No synthetic fertilizers or pesticides."
      ]
    },
    {
      id: "no-preservatives",
      term: "No Preservatives",
      points: [
        "Means no added preservatives are used.",
        "The product may still contain ingredients that naturally help preserve it."
      ]
    },
    {
      id: "natural",
      term: "Natural / All Natural",
      points: [
        "Usually means ingredients come from natural sources.",
        "This term does not always have a strict legal definition.",
        "Always read the ingredients list."
      ]
    }
  ];

  const ingredientTerms = [
    {
      id: "nature-identical-flavours",
      term: "Nature Identical Flavouring Substances",
      points: [
        "Flavours made to copy natural taste.",
        "These are artificial or synthetic flavours."
      ]
    },
    {
      id: "ins-number",
      term: "INS Number",
      points: [
        "Code used for food additives.",
        "Depending on the number, it can mean preservatives, acidity regulators, sweeteners, colours, flavours, or stabilizers."
      ]
    },
    {
      id: "acidity-regulators",
      term: "Acidity Regulators",
      points: [
        "Used to control sourness or acidity.",
        "Can be natural or synthetic."
      ]
    },
    {
      id: "stabilizers",
      term: "Stabilizers",
      points: [
        "Help keep texture and consistency.",
        "Can be natural or synthetic."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed py-12" style={{
      backgroundImage: `url(${window.innerWidth < 768 ? mkbg : pckbg})`,
    }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Headline */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-saira font-black uppercase text-[#3b2a20]">
            KNOW YOUR <span style={{ color: '#3b2a20' }}>FOOD</span>
          </h1>
          <p className="text-lg md:text-xl font-poppins text-[#3b2a20] mt-2">
            Food labels and ingredients, explained simply.
          </p>
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
