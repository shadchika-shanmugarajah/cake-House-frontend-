import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  // ── Seed admin users ───────────────────────────────────────
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount === 0) {
    const admin1 = new User({ name: 'Super Admin', email: 'admin@example.com', password: 'admin123', role: 'admin' });
    const admin2 = new User({ name: 'Manager', email: 'manager@example.com', password: 'manager123', role: 'admin' });
    await admin1.save();
    await admin2.save();
    console.log('Admin users seeded (passwords hashed via bcrypt)');
  } else {
    console.log(`Skipped admin seeding — ${adminCount} admin(s) already exist`);
  }

  // ── Seed categories ────────────────────────────────────────
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    await Category.insertMany([
      { name: 'Birthday', description: 'Birthday celebration cakes' },
      { name: 'Wedding', description: 'Wedding and engagement cakes' },
      { name: 'Custom', description: 'Custom designed cakes' },
      { name: 'Seasonal', description: 'Seasonal special cakes' },
      { name: 'Cupcakes', description: 'Individual cupcakes and minis' },
    ]);
    console.log('Categories seeded');
  }

  // ── Seed products ──────────────────────────────────────────
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    const categories = await Category.find();
    const getCatId = (name) => categories.find(c => c.name === name)?._id;

    await Product.insertMany([
      { productName: 'Chocolate Truffle Cake', description: 'Rich dark chocolate cake with truffle filling', price: 3599, categoryId: getCatId('Birthday'), image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop', averageRating: 4.8, reviewCount: 124, featured: true, stockQuantity: 15 },
      { productName: 'Wedding Cake Deluxe', description: 'Elegant multi-tier wedding cake', price: 1999, categoryId: getCatId('Wedding'), image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&h=300&fit=crop', averageRating: 4.9, reviewCount: 89, featured: true, stockQuantity: 8 },
      { productName: 'Vanilla Dream Cake', description: 'Light vanilla sponge with buttercream', price: 2899, categoryId: getCatId('Birthday'), image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop', averageRating: 4.5, reviewCount: 67, featured: false, stockQuantity: 22 },
      { productName: 'Strawberry Delight', description: 'Fresh strawberry cake with whipped cream', price: 3499, categoryId: getCatId('Seasonal'), image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop', averageRating: 4.7, reviewCount: 92, featured: true, stockQuantity: 12 },
      { productName: 'Lemon Drizzle Cake', description: 'Zesty lemon cake with drizzle icing', price: 2799, categoryId: getCatId('Custom'), image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=300&fit=crop', averageRating: 4.4, reviewCount: 38, featured: true, stockQuantity: 5 },
    ]);
    console.log('Products seeded');
  }

  console.log('Seed completed');
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
