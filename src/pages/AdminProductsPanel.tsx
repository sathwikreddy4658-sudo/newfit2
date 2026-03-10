import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, auth } from "@/integrations/firebase/auth";
import { getProduct, updateProduct, getAllProducts } from "@/integrations/firebase/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, X } from "lucide-react";
import { Timestamp } from "firebase/firestore";

interface NutritionData {
  serving_size_1_g: number;
  serving_size_2_g: number;
  energy_serving_1: number;
  protein_serving_1: number;
  carbs_serving_1: number;
  sugars_serving_1: number;
  added_sugars_serving_1: number;
  fat_serving_1: number;
  sat_fat_serving_1: number;
  trans_fat_serving_1: number;
  sodium_serving_1: number;
  cholesterol_serving_1: number;
  energy_serving_2: number;
  protein_serving_2: number;
  carbs_serving_2: number;
  sugars_serving_2: number;
  added_sugars_serving_2: number;
  fat_serving_2: number;
  sat_fat_serving_2: number;
  trans_fat_serving_2: number;
  sodium_serving_2: number;
  cholesterol_serving_2: number;
}

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  nutrition: NutritionData;
}

const AdminProductsPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        toast({
          title: "Access Denied",
          description: "You must be logged in to access admin panel",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Optional: Check if user is admin (you can add Firestore rules for this)
      setUser(firebaseUser);
      fetchProducts();
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await getAllProducts();
      const proteinBars = allProducts.filter((p: any) => p.category === "protein_bars");
      setProducts(proteinBars);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (product: any) => {
    try {
      const fullProduct = await getProduct(product.id);
      if (fullProduct) {
        const defaultNutrition: NutritionData = {
          serving_size_1_g: 60,
          serving_size_2_g: 100,
          energy_serving_1: 0,
          protein_serving_1: 0,
          carbs_serving_1: 0,
          sugars_serving_1: 0,
          added_sugars_serving_1: 0,
          fat_serving_1: 0,
          sat_fat_serving_1: 0,
          trans_fat_serving_1: 0,
          sodium_serving_1: 0,
          cholesterol_serving_1: 0,
          energy_serving_2: 0,
          protein_serving_2: 0,
          carbs_serving_2: 0,
          sugars_serving_2: 0,
          added_sugars_serving_2: 0,
          fat_serving_2: 0,
          sat_fat_serving_2: 0,
          trans_fat_serving_2: 0,
          sodium_serving_2: 0,
          cholesterol_serving_2: 0,
        };

        // Check if nutrition is nested object or flattened fields
        let nutritionData: NutritionData;
        const fp = fullProduct as any; // Allow access to flattened fields
        if (fullProduct.nutrition && typeof fullProduct.nutrition === 'object' && 'serving_size_1_g' in fullProduct.nutrition) {
          // Nutrition is nested
          nutritionData = { ...defaultNutrition, ...fullProduct.nutrition };
        } else {
          // Nutrition is flattened at root level - reconstruct it
          nutritionData = {
            serving_size_1_g: fp.serving_size_1_g ?? 60,
            serving_size_2_g: fp.serving_size_2_g ?? 100,
            energy_serving_1: fp.energy_serving_1 ?? 0,
            protein_serving_1: fp.protein_serving_1 ?? 0,
            carbs_serving_1: fp.carbs_serving_1 ?? 0,
            sugars_serving_1: fp.sugars_serving_1 ?? 0,
            added_sugars_serving_1: fp.added_sugars_serving_1 ?? 0,
            fat_serving_1: fp.fat_serving_1 ?? 0,
            sat_fat_serving_1: fp.sat_fat_serving_1 ?? 0,
            trans_fat_serving_1: fp.trans_fat_serving_1 ?? 0,
            sodium_serving_1: fp.sodium_serving_1 ?? 0,
            cholesterol_serving_1: fp.cholesterol_serving_1 ?? 0,
            energy_serving_2: fp.energy_serving_2 ?? 0,
            protein_serving_2: fp.protein_serving_2 ?? 0,
            carbs_serving_2: fp.carbs_serving_2 ?? 0,
            sugars_serving_2: fp.sugars_serving_2 ?? 0,
            added_sugars_serving_2: fp.added_sugars_serving_2 ?? 0,
            fat_serving_2: fp.fat_serving_2 ?? 0,
            sat_fat_serving_2: fp.sat_fat_serving_2 ?? 0,
            trans_fat_serving_2: fp.trans_fat_serving_2 ?? 0,
            sodium_serving_2: fp.sodium_serving_2 ?? 0,
            cholesterol_serving_2: fp.cholesterol_serving_2 ?? 0,
          };
        }

        setSelectedProduct({
          id: fullProduct.id,
          name: fullProduct.name,
          description: fullProduct.description || "",
          ingredients: Array.isArray(fullProduct.ingredients) ? fullProduct.ingredients : [],
          nutrition: nutritionData,
        });
      }
    } catch (error) {
      console.error("Error loading product:", error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    
    if (!selectedProduct.id) {
      console.error('Product ID is missing!', selectedProduct);
      toast({
        title: "Error",
        description: "Product ID is missing. Please select a product again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Prepare nutrition data by flattening it directly on the product object
      const updateData = {
        description: selectedProduct.description ?? '',
        ingredients: Array.isArray(selectedProduct.ingredients) ? selectedProduct.ingredients.filter((i: string) => i && i.trim()) : [],
        // Flatten nutrition fields directly using ?? to preserve 0 values
        serving_size_1_g: selectedProduct.nutrition?.serving_size_1_g ?? 60,
        serving_size_2_g: selectedProduct.nutrition?.serving_size_2_g ?? 100,
        energy_serving_1: selectedProduct.nutrition?.energy_serving_1 ?? 0,
        protein_serving_1: selectedProduct.nutrition?.protein_serving_1 ?? 0,
        carbs_serving_1: selectedProduct.nutrition?.carbs_serving_1 ?? 0,
        sugars_serving_1: selectedProduct.nutrition?.sugars_serving_1 ?? 0,
        added_sugars_serving_1: selectedProduct.nutrition?.added_sugars_serving_1 ?? 0,
        fat_serving_1: selectedProduct.nutrition?.fat_serving_1 ?? 0,
        sat_fat_serving_1: selectedProduct.nutrition?.sat_fat_serving_1 ?? 0,
        trans_fat_serving_1: selectedProduct.nutrition?.trans_fat_serving_1 ?? 0,
        sodium_serving_1: selectedProduct.nutrition?.sodium_serving_1 ?? 0,
        cholesterol_serving_1: selectedProduct.nutrition?.cholesterol_serving_1 ?? 0,
        energy_serving_2: selectedProduct.nutrition?.energy_serving_2 ?? 0,
        protein_serving_2: selectedProduct.nutrition?.protein_serving_2 ?? 0,
        carbs_serving_2: selectedProduct.nutrition?.carbs_serving_2 ?? 0,
        sugars_serving_2: selectedProduct.nutrition?.sugars_serving_2 ?? 0,
        added_sugars_serving_2: selectedProduct.nutrition?.added_sugars_serving_2 ?? 0,
        fat_serving_2: selectedProduct.nutrition?.fat_serving_2 ?? 0,
        sat_fat_serving_2: selectedProduct.nutrition?.sat_fat_serving_2 ?? 0,
        trans_fat_serving_2: selectedProduct.nutrition?.trans_fat_serving_2 ?? 0,
        sodium_serving_2: selectedProduct.nutrition?.sodium_serving_2 ?? 0,
        cholesterol_serving_2: selectedProduct.nutrition?.cholesterol_serving_2 ?? 0,
      };
      
      await updateProduct(selectedProduct.id, updateData);

      toast({
        title: "Success!",
        description: "Product updated successfully",
      });

      // Refresh product list
      fetchProducts();
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateNutrition = (field: keyof ProductDetails["nutrition"], value: number) => {
    if (!selectedProduct) return;
    setSelectedProduct({
      ...selectedProduct,
      nutrition: {
        ...selectedProduct.nutrition,
        [field]: value,
      },
    });
  };

  const addIngredient = () => {
    if (!selectedProduct) return;
    setSelectedProduct({
      ...selectedProduct,
      ingredients: [...selectedProduct.ingredients, ""],
    });
  };

  const updateIngredient = (index: number, value: string) => {
    if (!selectedProduct) return;
    const newIngredients = [...selectedProduct.ingredients];
    newIngredients[index] = value;
    setSelectedProduct({
      ...selectedProduct,
      ingredients: newIngredients,
    });
  };

  const removeIngredient = (index: number) => {
    if (!selectedProduct) return;
    setSelectedProduct({
      ...selectedProduct,
      ingredients: selectedProduct.ingredients.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {!selectedProduct ? (
          <>
            {/* Product List View */}
            <div className="mb-8">
              <Button
                onClick={() => navigate("/")}
                className="mb-4 bg-primary/80 hover:bg-primary text-gray-900 font-bold"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Site
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-10 bg-gradient-to-b from-primary to-accent rounded"></div>
                <h1 className="text-4xl font-bold text-gray-900">Product Details Editor</h1>
              </div>
              <p className="text-gray-600 ml-4">Select a product to edit descriptions, ingredients, and nutrition</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="bg-white border-2 hover:border-primary border-gray-200 cursor-pointer transition-all p-6 hover:shadow-xl hover:scale-105"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 mb-4 h-24 flex items-center justify-center">
                    <h3 className="text-lg font-bold text-gray-900 text-center">{product.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-6">Click to edit product details</p>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-gray-900 font-bold">
                    Edit Product →
                  </Button>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Product Edit View */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1 h-10 bg-gradient-to-b from-primary to-accent rounded"></div>
                  <h1 className="text-4xl font-bold text-gray-900">Edit: {selectedProduct.name}</h1>
                </div>
                <p className="text-gray-600 ml-4">Update product information</p>
              </div>
              <Button
                onClick={() => setSelectedProduct(null)}
                className="bg-primary/80 hover:bg-primary text-gray-900 font-bold"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-8">
              {/* Description Section */}
              <Card className="bg-white border-2 border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-primary rounded"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Product Description</h2>
                </div>
                <textarea
                  value={selectedProduct.description}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter product description..."
                  className="w-full h-32 bg-gray-50 text-gray-900 p-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:outline-none placeholder-gray-400"
                />
                <p className="text-gray-600 text-sm mt-2">Use line breaks for bullet points. This appears on the product detail page.</p>
              </Card>

              {/* Ingredients Section */}
              <Card className="bg-white border-2 border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-primary rounded"></div>
                  <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">Inside The Bar</h2>
                </div>
                <div className="space-y-2 mb-4">
                  {selectedProduct.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        placeholder="Enter ingredient..."
                        className="flex-1 bg-gray-50 text-gray-900 p-2 rounded-lg border-2 border-gray-200 focus:border-primary focus:outline-none placeholder-gray-400"
                      />
                      <Button
                        onClick={() => removeIngredient(index)}
                        size="sm"
                        variant="destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={addIngredient}
                  className="w-full bg-primary hover:bg-primary/90 text-gray-900 font-bold"
                >
                  + Add Ingredient
                </Button>
              </Card>

              {/* Nutrition Section */}
              <Card className="bg-white border-2 border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-primary rounded"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Nutrition Info</h2>
                </div>

                {/* Serving Size Configuration */}
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-lg mb-6 border-2 border-primary/20">
                  <p className="text-gray-700 font-semibold text-sm mb-4">Configure serving sizes (in grams):</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">Serving 1 Size (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.serving_size_1_g}
                        onChange={(e) =>
                          updateNutrition("serving_size_1_g", parseFloat(e.target.value) || 0)
                        }
                        placeholder="e.g., 49, 55, 60"
                        className="w-full bg-white text-gray-900 p-2 rounded-lg border-2 border-gray-200 focus:border-primary focus:outline-none placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">Serving 2 Size (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.serving_size_2_g}
                        onChange={(e) =>
                          updateNutrition("serving_size_2_g", parseFloat(e.target.value) || 0)
                        }
                        placeholder="e.g., 100"
                        className="w-full bg-white text-gray-900 p-2 rounded-lg border-2 border-gray-200 focus:border-primary focus:outline-none placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Per Serving 1 */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-0.5 h-5 bg-primary"></div>
                    <h3 className="text-lg font-bold text-primary">Per {selectedProduct.nutrition.serving_size_1_g}g</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Energy (kcal)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.energy_serving_1}
                        onChange={(e) =>
                          updateNutrition("energy_serving_1", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.protein_serving_1}
                        onChange={(e) =>
                          updateNutrition("protein_serving_1", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Carbohydrates (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.carbs_serving_1}
                        onChange={(e) =>
                          updateNutrition("carbs_serving_1", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Total Sugars (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.sugars_serving_1}
                        onChange={(e) =>
                          updateNutrition("sugars_serving_1", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Added Sugars (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.added_sugars_serving_1}
                        onChange={(e) =>
                          updateNutrition("added_sugars_serving_1", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Fat (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.fat_serving_1}
                        onChange={(e) =>
                          updateNutrition("fat_serving_1", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Saturated Fat (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.sat_fat_serving_1}
                        onChange={(e) =>
                          updateNutrition("sat_fat_serving_1", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Trans Fat (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.trans_fat_serving_1}
                        onChange={(e) =>
                          updateNutrition("trans_fat_serving_1", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Sodium (mg)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.sodium_serving_1}
                        onChange={(e) =>
                          updateNutrition("sodium_serving_1", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Cholesterol (mg)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.cholesterol_serving_1}
                        onChange={(e) =>
                          updateNutrition("cholesterol_serving_1", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Per Serving 2 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-0.5 h-5 bg-primary"></div>
                    <h3 className="text-lg font-bold text-primary">Per {selectedProduct.nutrition.serving_size_2_g}g</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Energy (kcal)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.energy_serving_2}
                        onChange={(e) =>
                          updateNutrition("energy_serving_2", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.protein_serving_2}
                        onChange={(e) =>
                          updateNutrition("protein_serving_2", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Carbohydrates (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.carbs_serving_2}
                        onChange={(e) =>
                          updateNutrition("carbs_serving_2", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Total Sugars (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.sugars_serving_2}
                        onChange={(e) =>
                          updateNutrition("sugars_serving_2", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Added Sugars (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.added_sugars_serving_2}
                        onChange={(e) =>
                          updateNutrition("added_sugars_serving_2", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Fat (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.fat_serving_2}
                        onChange={(e) =>
                          updateNutrition("fat_serving_2", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Saturated Fat (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.sat_fat_serving_2}
                        onChange={(e) =>
                          updateNutrition("sat_fat_serving_2", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Trans Fat (g)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.trans_fat_serving_2}
                        onChange={(e) =>
                          updateNutrition("trans_fat_serving_2", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Sodium (mg)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.sodium_serving_2}
                        onChange={(e) =>
                          updateNutrition("sodium_serving_2", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Cholesterol (mg)</label>
                      <input
                        type="number"
                        value={selectedProduct.nutrition.cholesterol_serving_2}
                        onChange={(e) =>
                          updateNutrition("cholesterol_serving_2", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Save Button */}
              <div className="flex gap-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary/90 text-gray-900 py-6 text-lg font-bold shadow-lg"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-6 text-lg font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPanel;
