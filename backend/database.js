import mongoose from 'mongoose';

// Disable buffering commands globally so that Mongoose fails immediately if disconnected
// instead of hanging/buffering queries for 10 seconds.
mongoose.set('bufferCommands', false);

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sensex_trader';

export const connectDB = async () => {
  try {
    // Set a lower connection timeout for local testing (e.g. 2 seconds instead of 30)
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000 
    });
    console.log('MongoDB connected successfully to:', mongoURI);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Using in-memory fallback mode since MongoDB service is offline.');
  }
};

// Check if database is fully connected (readyState === 1)
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

// New User Schema for authentication
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: 'blue' }, // Avatar color theme: blue, emerald, purple, orange
  tradingLevel: { type: String, default: 'Novice' }, // Novice, Intermediate, Expert
  createdAt: { type: Date, default: Date.now }
});

const HoldingSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  avgPrice: { type: Number, required: true },
  takeProfitPercent: { type: Number, default: 0 },
  stopLossPercent: { type: Number, default: 0 }
});

const PortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  balance: { type: Number, default: 1000000 },
  holdings: [HoldingSchema]
});

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const WatchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbols: { type: [String], default: ['SENSEX', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY'] }
});

const PendingOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // limit price
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  takeProfitPercent: { type: Number, default: 0 },
  stopLossPercent: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
export const Portfolio = mongoose.model('Portfolio', PortfolioSchema);
export const Transaction = mongoose.model('Transaction', TransactionSchema);
export const Watchlist = mongoose.model('Watchlist', WatchlistSchema);
export const PendingOrder = mongoose.model('PendingOrder', PendingOrderSchema);

