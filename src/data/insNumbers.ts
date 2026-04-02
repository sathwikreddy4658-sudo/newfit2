// INS (International Numbering System) food additive data
// Add, remove, or edit entries here to update the INS lookup on the Know Your Food page.

export interface INSEntry {
  number: string;
  name: string;
  category: string;
  definition?: string;
}

export const INS_NUMBERS: INSEntry[] = [
  // ── Colors ─────────────────────────────────────────────────────────
  { number: "100", name: "Curcumin", category: "Color", definition: "Natural yellow-orange pigment from turmeric root; used to colour curries, mustard, dairy products, and snacks." },
  { number: "101", name: "Riboflavin (Vitamin B2)", category: "Color" },
  { number: "102", name: "Tartrazine", category: "Color" },
  { number: "110", name: "Sunset Yellow FCF", category: "Color" },
  { number: "120", name: "Cochineal / Carmine", category: "Color" },
  { number: "122", name: "Azorubine / Carmoisine", category: "Color" },
  { number: "124", name: "Ponceau 4R", category: "Color" },
  { number: "127", name: "Erythrosine", category: "Color" },
  { number: "129", name: "Allura Red AC", category: "Color" },
  { number: "132", name: "Indigo Carmine", category: "Color" },
  { number: "133", name: "Brilliant Blue FCF", category: "Color" },
  { number: "150a", name: "Plain Caramel", category: "Color", definition: "Natural brown colour made by heat-treating sugar alone; used in sauces, gravies, and baked goods." },
  { number: "150b", name: "Caustic Sulphite Caramel", category: "Color", definition: "Brown colour made by heating sugar with sulphite compounds; used in spirits, vinegar, and confectionery." },
  { number: "150c", name: "Ammonia Caramel", category: "Color", definition: "Brown colour made by heating sugar with ammonium compounds; used in beer, bread, and soy sauce." },
  { number: "150d", name: "Sulphite Ammonia Caramel", category: "Color", definition: "Brown colour made with both sulphite and ammonia; primarily used in cola soft drinks and dark sauces." },
  { number: "160a", name: "Beta-Carotene", category: "Color", definition: "Natural orange pigment from carrots and plants (also produced synthetically); used in margarine, dairy, and beverages; a source of Vitamin A." },
  { number: "160b", name: "Annatto / Bixin / Norbixin", category: "Color" },
  { number: "162", name: "Beetroot Red", category: "Color" },
  { number: "170", name: "Calcium Carbonate", category: "Color" },
  { number: "171", name: "Titanium Dioxide", category: "Color", definition: "Synthetic white pigment; used in confectionery, chewing gum, and dairy to whiten and brighten products. Restricted or banned in some regions (e.g., the EU)." },
  { number: "172", name: "Iron Oxides and Hydroxides", category: "Color" },

  // ── Preservatives ───────────────────────────────────────────────────
  { number: "200", name: "Sorbic Acid", category: "Preservative" },
  { number: "202", name: "Potassium Sorbate", category: "Preservative", definition: "Synthetic salt of naturally occurring sorbic acid; prevents mould and yeast growth in cheese, baked goods, wine, and dried fruits." },
  { number: "203", name: "Calcium Sorbate", category: "Preservative" },
  { number: "210", name: "Benzoic Acid", category: "Preservative" },
  { number: "211", name: "Sodium Benzoate", category: "Preservative", definition: "Synthetic preservative derived from benzoic acid; inhibits mould and bacteria in soft drinks, juices, and condiments." },
  { number: "212", name: "Potassium Benzoate", category: "Preservative" },
  { number: "213", name: "Calcium Benzoate", category: "Preservative" },
  { number: "220", name: "Sulphur Dioxide", category: "Preservative", definition: "Can be natural or synthetic; prevents browning and microbial growth in dried fruits, wine, and fruit juices." },
  { number: "221", name: "Sodium Sulphite", category: "Preservative" },
  { number: "223", name: "Sodium Metabisulphite", category: "Preservative", definition: "Synthetic preservative and antioxidant; prevents browning and spoilage in dried fruits, wine, and seafood." },
  { number: "224", name: "Potassium Metabisulphite", category: "Preservative" },
  { number: "249", name: "Potassium Nitrite", category: "Preservative" },
  { number: "250", name: "Sodium Nitrite", category: "Preservative" },
  { number: "251", name: "Sodium Nitrate", category: "Preservative" },
  { number: "252", name: "Potassium Nitrate", category: "Preservative" },
  { number: "280", name: "Propionic Acid", category: "Preservative" },
  { number: "281", name: "Sodium Propionate", category: "Preservative" },
  { number: "282", name: "Calcium Propionate", category: "Preservative" },
  { number: "283", name: "Potassium Propionate", category: "Preservative" },

  // ── Acidity Regulators ──────────────────────────────────────────────
  { number: "260", name: "Acetic Acid", category: "Acidity Regulator" },
  { number: "261", name: "Potassium Acetate", category: "Acidity Regulator" },
  { number: "262", name: "Sodium Acetates", category: "Acidity Regulator" },
  { number: "263", name: "Calcium Acetate", category: "Acidity Regulator" },
  { number: "270", name: "Lactic Acid", category: "Acidity Regulator", definition: "Produced naturally by fermentation (also made synthetically); regulates acidity and acts as a mild preservative in fermented foods, dairy products, and beverages." },
  { number: "296", name: "Malic Acid", category: "Acidity Regulator", definition: "Found naturally in apples and other fruits (also synthetically produced); adds tartness and regulates acidity in confectionery and soft drinks." },
  { number: "330", name: "Citric Acid", category: "Acidity Regulator", definition: "Found naturally in citrus fruits (also produced via fermentation); adds sourness, controls pH, and acts as a mild preservative in beverages, candies, and preserves." },
  { number: "331", name: "Sodium Citrates", category: "Acidity Regulator", definition: "Sodium salt of citric acid; buffers acidity and acts as an emulsifying salt in processed cheeses and soft drinks." },
  { number: "332", name: "Potassium Citrates", category: "Acidity Regulator" },
  { number: "333", name: "Calcium Citrates", category: "Acidity Regulator" },
  { number: "334", name: "Tartaric Acid", category: "Acidity Regulator" },
  { number: "336", name: "Potassium Tartrates", category: "Acidity Regulator" },
  { number: "338", name: "Phosphoric Acid", category: "Acidity Regulator" },
  { number: "339", name: "Sodium Phosphates", category: "Acidity Regulator" },
  { number: "340", name: "Potassium Phosphates", category: "Acidity Regulator" },
  { number: "341", name: "Calcium Phosphates", category: "Acidity Regulator" },
  { number: "575", name: "Glucono Delta-Lactone", category: "Acidity Regulator" },

  // ── Antioxidants ────────────────────────────────────────────────────
  { number: "300", name: "Ascorbic Acid (Vitamin C)", category: "Antioxidant", definition: "Natural or synthetically produced form of Vitamin C; prevents oxidation and browning in fruits, flour, and beverages." },
  { number: "301", name: "Sodium Ascorbate", category: "Antioxidant" },
  { number: "302", name: "Calcium Ascorbate", category: "Antioxidant" },
  { number: "304", name: "Ascorbyl Palmitate", category: "Antioxidant" },
  { number: "306", name: "Mixed Tocopherols (Vitamin E)", category: "Antioxidant", definition: "Natural antioxidants derived from vegetable oils; prevent rancidity in fats, oils, and fat-containing foods." },
  { number: "307", name: "Alpha-Tocopherol (Vitamin E)", category: "Antioxidant" },
  { number: "310", name: "Propyl Gallate", category: "Antioxidant" },
  { number: "319", name: "TBHQ (Tertiary Butylhydroquinone)", category: "Antioxidant" },
  { number: "320", name: "BHA (Butylated Hydroxyanisole)", category: "Antioxidant" },
  { number: "321", name: "BHT (Butylated Hydroxytoluene)", category: "Antioxidant" },

  // ── Thickeners / Stabilizers ────────────────────────────────────────
  { number: "400", name: "Alginic Acid", category: "Thickener / Stabilizer" },
  { number: "401", name: "Sodium Alginate", category: "Thickener / Stabilizer" },
  { number: "402", name: "Potassium Alginate", category: "Thickener / Stabilizer" },
  { number: "404", name: "Calcium Alginate", category: "Thickener / Stabilizer" },
  { number: "406", name: "Agar", category: "Thickener / Stabilizer" },
  { number: "407", name: "Carrageenan", category: "Thickener / Stabilizer", definition: "Natural thickener and stabilizer extracted from red seaweed; adds texture and body to dairy products, plant milks, and processed meats." },
  { number: "410", name: "Locust Bean Gum", category: "Thickener / Stabilizer" },
  { number: "412", name: "Guar Gum", category: "Thickener / Stabilizer", definition: "Natural thickener ground from guar beans; improves texture and thickness in dairy products, baked goods, and sauces." },
  { number: "413", name: "Tragacanth Gum", category: "Thickener / Stabilizer" },
  { number: "414", name: "Acacia / Gum Arabic", category: "Thickener / Stabilizer" },
  { number: "415", name: "Xanthan Gum", category: "Thickener / Stabilizer", definition: "Semi-synthetic thickener produced by bacterial fermentation of sugars; used in sauces, salad dressings, and gluten-free baking for texture and stability." },
  { number: "418", name: "Gellan Gum", category: "Thickener / Stabilizer" },
  { number: "440", name: "Pectin", category: "Thickener / Stabilizer", definition: "Natural gelling agent extracted from fruit peels; used in jams, jellies, and fruit fillings to create a firm gel texture." },
  { number: "460", name: "Cellulose", category: "Thickener / Stabilizer" },
  { number: "461", name: "Methyl Cellulose", category: "Thickener / Stabilizer" },
  { number: "466", name: "Carboxymethyl Cellulose (CMC)", category: "Thickener / Stabilizer" },

  // ── Emulsifiers ─────────────────────────────────────────────────────
  { number: "322", name: "Lecithins", category: "Emulsifier", definition: "Natural emulsifier derived from soy, sunflower, or eggs; blends fats and water in chocolate, baked goods, and salad dressings." },
  { number: "450", name: "Diphosphates", category: "Emulsifier" },
  { number: "451", name: "Triphosphates", category: "Emulsifier" },
  { number: "452", name: "Polyphosphates", category: "Emulsifier" },
  { number: "471", name: "Mono and Diglycerides of Fatty Acids", category: "Emulsifier", definition: "Synthetically derived from fats and oils; improves texture, softness, and shelf life in bread, margarine, and ice cream." },
  { number: "472", name: "Esters of Fatty Acids", category: "Emulsifier", definition: "Synthetic emulsifiers made from fatty acids and various organic acids; improve dough structure and volume in bread, pastries, and processed foods." },
  { number: "472e", name: "Diacetyl Tartaric Acid Esters (DATEM)", category: "Emulsifier" },
  { number: "476", name: "Polyglycerol Polyricinoleate (PGPR)", category: "Emulsifier" },
  { number: "481", name: "Sodium Stearoyl Lactylate (SSL)", category: "Emulsifier" },
  { number: "482", name: "Calcium Stearoyl Lactylate", category: "Emulsifier" },

  // ── Sweeteners / Sugar Alcohols ─────────────────────────────────────
  { number: "420", name: "Sorbitol", category: "Sweetener / Humectant" },
  { number: "421", name: "Mannitol", category: "Sweetener / Humectant" },
  { number: "422", name: "Glycerol", category: "Humectant" },
  { number: "950", name: "Acesulfame Potassium (Ace-K)", category: "Sweetener", definition: "Synthetic high-intensity sweetener (~200× sweeter than sugar); calorie-free; used in diet drinks, confectionery, and tabletop sweeteners." },
  { number: "951", name: "Aspartame", category: "Sweetener", definition: "Synthetic high-intensity sweetener (~200× sweeter than sugar); low-calorie; used in diet beverages, chewing gum, and desserts." },
  { number: "952", name: "Cyclamates", category: "Sweetener" },
  { number: "953", name: "Isomalt", category: "Sweetener / Bulking Agent" },
  { number: "954", name: "Saccharin", category: "Sweetener" },
  { number: "955", name: "Sucralose", category: "Sweetener", definition: "Synthetic sweetener made from sugar (~600× sweeter); calorie-free and heat-stable; used in baked goods, dairy products, and beverages." },
  { number: "960", name: "Steviol Glycosides (Stevia)", category: "Sweetener", definition: "Natural sweetener extracted from stevia leaves (200–400× sweeter than sugar); calorie-free; used in beverages, dairy products, and snacks." },
  { number: "961", name: "Neotame", category: "Sweetener" },
  { number: "965", name: "Maltitol", category: "Sweetener / Bulking Agent" },
  { number: "966", name: "Lactitol", category: "Sweetener / Bulking Agent" },
  { number: "967", name: "Xylitol", category: "Sweetener / Bulking Agent" },
  { number: "968", name: "Erythritol", category: "Sweetener / Bulking Agent" },

  // ── Raising / Leavening Agents ──────────────────────────────────────
  { number: "500", name: "Sodium Carbonates", category: "Raising Agent" },
  { number: "500i", name: "Sodium Carbonate (Washing Soda)", category: "Raising Agent" },
  { number: "500ii", name: "Sodium Bicarbonate (Baking Soda)", category: "Raising Agent", definition: "Mineral-derived leavening agent; reacts with acids to release CO₂, making baked goods rise. Used in cakes, biscuits, and bread." },
  { number: "501", name: "Potassium Bicarbonate", category: "Raising Agent", definition: "Mineral-derived leavening agent; a sodium-free alternative to baking soda used in baked goods and as an acidity regulator in wine." },
  { number: "503i", name: "Ammonium Carbonate", category: "Raising Agent", definition: "Synthetic leavening agent; breaks down into gases (CO₂ and ammonia) when heated; used in dry crackers and flat baked goods where ammonia can fully escape." },
  { number: "503ii", name: "Ammonium Bicarbonate", category: "Raising Agent" },
  { number: "504", name: "Magnesium Carbonates", category: "Raising Agent" },

  // ── Anti-caking Agents ──────────────────────────────────────────────
  { number: "530", name: "Magnesium Oxide", category: "Anti-caking Agent" },
  { number: "535", name: "Sodium Ferrocyanide", category: "Anti-caking Agent" },
  { number: "551", name: "Silicon Dioxide", category: "Anti-caking Agent" },
  { number: "552", name: "Calcium Silicate", category: "Anti-caking Agent" },
  { number: "553", name: "Magnesium Silicate / Talc", category: "Anti-caking Agent" },
  { number: "554", name: "Sodium Aluminosilicate", category: "Anti-caking Agent" },
  { number: "570", name: "Fatty Acids", category: "Anti-caking Agent" },

  // ── Flavour Enhancers ───────────────────────────────────────────────
  { number: "620", name: "Glutamic Acid", category: "Flavour Enhancer" },
  { number: "621", name: "Monosodium Glutamate (MSG)", category: "Flavour Enhancer" },
  { number: "622", name: "Monopotassium Glutamate", category: "Flavour Enhancer" },
  { number: "627", name: "Disodium Guanylate", category: "Flavour Enhancer" },
  { number: "631", name: "Disodium Inosinate", category: "Flavour Enhancer" },
  { number: "635", name: "Disodium Ribonucleotides", category: "Flavour Enhancer" },

  // ── Salt Substitutes / Firming Agents ───────────────────────────────
  { number: "508", name: "Potassium Chloride", category: "Salt Substitute" },
  { number: "509", name: "Calcium Chloride", category: "Firming Agent" },
  { number: "516", name: "Calcium Sulphate", category: "Firming Agent" },
  { number: "577", name: "Potassium Gluconate", category: "Sequestrant" },

  // ── Glazing / Coating Agents ────────────────────────────────────────
  { number: "900", name: "Dimethyl Polysiloxane", category: "Antifoaming Agent" },
  { number: "901", name: "Beeswax", category: "Glazing Agent" },
  { number: "903", name: "Carnauba Wax", category: "Glazing Agent" },
  { number: "904", name: "Shellac", category: "Glazing Agent" },

  // ── Modified Starches ───────────────────────────────────────────────
  { number: "1200", name: "Polydextrose", category: "Bulking Agent" },
  { number: "1400", name: "Dextrin", category: "Modified Starch" },
  { number: "1404", name: "Oxidized Starch", category: "Modified Starch" },
  { number: "1410", name: "Monostarch Phosphate", category: "Modified Starch" },
  { number: "1412", name: "Distarch Phosphate", category: "Modified Starch" },
  { number: "1413", name: "Phosphated Distarch Phosphate", category: "Modified Starch" },
  { number: "1414", name: "Acetylated Distarch Phosphate", category: "Modified Starch" },
  { number: "1420", name: "Starch Acetate", category: "Modified Starch" },
  { number: "1422", name: "Acetylated Distarch Adipate", category: "Modified Starch" },
  { number: "1440", name: "Hydroxypropyl Starch", category: "Modified Starch" },
  { number: "1442", name: "Hydroxypropyl Distarch Phosphate", category: "Modified Starch" },
  { number: "1450", name: "Starch Sodium Octenylsuccinate", category: "Modified Starch" },
];
