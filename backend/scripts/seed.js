import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Product from '../models/Product.js';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Admin.deleteMany({});
  await Admin.create([
    { email: 'admin@example.com', password: 'admin123', role: 'superadmin' },
    { email: 'manager@example.com', password: 'manager123', role: 'manager' },
  ]);
  const products = await Product.countDocuments();
  if (products === 0) {
    await Product.insertMany([
      { name: 'Chocolate Truffle Cake', description: 'Rich dark chocolate cake with truffle filling', price: 3599, category: 'Birthday', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop', rating: 4.8, reviewCount: 124, isTrending: true, stock: 15 },
      { name: 'Wedding Cake Deluxe', description: 'Elegant multi-tier wedding cake', price: 1999, category: 'Wedding', image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&h=300&fit=crop', rating: 4.9, reviewCount: 89, isTrending: true, stock: 8 },
      { name: 'Vanilla Dream Cake', description: 'Light vanilla sponge with buttercream', price: 2899, category: 'Birthday', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop', rating: 4.5, reviewCount: 67, isTrending: false, stock: 22 },
      { name: 'Strawberry Delight', description: 'Fresh strawberry cake with whipped cream', price: 3499, category: 'Seasonal', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop', rating: 4.7, reviewCount: 92, isTrending: true, stock: 12 },
      { name: 'Lemon Drizzle Cake', description: 'Zesty lemon cake with drizzle icing', price: 2799, category: 'Custom', image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=300&fit=crop', rating: 4.4, reviewCount: 38, isTrending: true, stock: 5 },
    ]);
  }
  console.log('Seed completed');
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
