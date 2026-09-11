const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

// Models
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Table = require('./models/Table');
const QRCode = require('./models/QRCode');
const Category = require('./models/Category');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const Customer = require('./models/Customer');
const InventoryItem = require('./models/InventoryItem');
const Offer = require('./models/Offer');
const Feedback = require('./models/Feedback');
const Notification = require('./models/Notification');
const WaiterCall = require('./models/WaiterCall');
const AuditLog = require('./models/AuditLog');

const seedDatabase = require('./seed/seedData');

async function migrate(targetUri) {
  if (!targetUri || targetUri.includes('<db_password>') || targetUri.includes('<YOUR_PASSWORD>')) {
    console.error('❌ Error: Please replace <db_password> with your actual MongoDB password in server/.env');
    process.exit(1);
  }

  console.log(`📡 Connecting to MongoDB Atlas: ${targetUri.replace(/:([^@]+)@/, ':****@')}`);
  try {
    await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected successfully to target MongoDB database!');

    console.log('🌱 Seeding & copying complete dataset to new database...');
    await seedDatabase();

    console.log('🎉 Data successfully migrated to MongoDB Atlas!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

const targetUri = process.argv[2] || process.env.MONGO_URI;
migrate(targetUri);
