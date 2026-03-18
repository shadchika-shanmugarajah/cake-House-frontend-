import mongoose from 'mongoose';

const dropLegacyIndexes = async () => {
  try {
    const ordersCollection = mongoose.connection.db.collection('orders');
    const indexNames = (await ordersCollection.indexes()).map((idx) => idx.name);

    if (indexNames.includes('id_1')) {
      await ordersCollection.dropIndex('id_1');
      console.log('Dropped legacy orders index: id_1');
    }
  } catch (error) {
    console.warn(`Index cleanup warning: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await dropLegacyIndexes();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
