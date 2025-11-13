import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://osromibanfzzthdmhyzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcm9taWJhbmZ6enRoZG1oeXpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgzMDMyOSwiZXhwIjoyMDc4NDA2MzI5fQ.I1P1jpiI5hHe5Hue57p1i8_kkQEC3a8tWtPJQUTpdTk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSampleProducts() {
  try {
    console.log('Signing in as admin...');

    // Sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@freelit.com',
      password: 'admin123'
    });

    if (authError) {
      console.error('Sign-in error:', authError.message);
      return;
    }

    console.log('Admin signed in successfully\n');

    // Sample products data
    const products = [
      {
        name: 'CHOCO NUT Protein Bar',
        category: 'protein_bars',
        price: 149.00,
        price_15g: 149.00,
        price_20g: 199.00,
        stock: 100,
        nutrition: 'Protein: 15g | Calories: 180 | Sugar: 8g',
        protein: '15g',
        sugar: '8g',
        calories: '180',
        weight: '30g',
        shelf_life: '12 months',
        allergens: 'Nuts, Milk',
        description: 'Delicious chocolate flavored protein bar with nuts. Perfect for post-workout recovery.',
        is_hidden: false
      },
      {
        name: 'VANILLA DELIGHT Protein Bar',
        category: 'protein_bars',
        price: 149.00,
        price_15g: 149.00,
        price_20g: 199.00,
        stock: 100,
        nutrition: 'Protein: 15g | Calories: 175 | Sugar: 6g',
        protein: '15g',
        sugar: '6g',
        calories: '175',
        weight: '30g',
        shelf_life: '12 months',
        allergens: 'Milk',
        description: 'Smooth vanilla flavored protein bar. Great taste and high protein content.',
        is_hidden: false
      },
      {
        name: 'STRAWBERRY CHEESECAKE Dessert Bar',
        category: 'dessert_bars',
        price: 129.00,
        price_15g: 129.00,
        price_20g: 179.00,
        stock: 50,
        nutrition: 'Protein: 12g | Calories: 160 | Sugar: 12g',
        protein: '12g',
        sugar: '12g',
        calories: '160',
        weight: '25g',
        shelf_life: '10 months',
        allergens: 'Milk, Gluten',
        description: 'Indulgent strawberry cheesecake flavored dessert bar. Guilt-free pleasure.',
        is_hidden: false
      },
      {
        name: 'DARK CHOCOLATE Chocolates',
        category: 'chocolates',
        price: 199.00,
        price_15g: 199.00,
        price_20g: 249.00,
        stock: 75,
        nutrition: 'Protein: 8g | Calories: 120 | Sugar: 10g',
        protein: '8g',
        sugar: '10g',
        calories: '120',
        weight: '20g',
        shelf_life: '8 months',
        allergens: 'Milk',
        description: 'Premium dark chocolate with protein. Rich flavor and healthy benefits.',
        is_hidden: false
      }
    ];

    console.log('Creating sample products...\n');

    for (const product of products) {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select();

      if (error) {
        console.error(`Error creating product "${product.name}":`, error.message);
      } else {
        console.log(`✅ Created product: ${product.name}`);
      }
    }

    console.log('\n🎉 Sample products creation completed!');

    // Sign out
    await supabase.auth.signOut();

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createSampleProducts();
