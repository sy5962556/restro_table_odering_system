const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB, closeDB } = require('../config/db');

// Load env vars
dotenv.config();

// Models
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const QRCode = require('../models/QRCode');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const InventoryItem = require('../models/InventoryItem');
const Offer = require('../models/Offer');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const WaiterCall = require('../models/WaiterCall');
const AuditLog = require('../models/AuditLog');

const { generateTableToken, generateQRCodeDataUrl } = require('../utils/qrGenerator');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    await connectDB();

    // Clear all existing collections
    console.log('🧹 Clearing old collections...');
    await User.deleteMany();
    await Restaurant.deleteMany();
    await Table.deleteMany();
    await QRCode.deleteMany();
    await Category.deleteMany();
    await MenuItem.deleteMany();
    await Order.deleteMany();
    await Invoice.deleteMany();
    await Payment.deleteMany();
    await Customer.deleteMany();
    await InventoryItem.deleteMany();
    await Offer.deleteMany();
    await Feedback.deleteMany();
    await Notification.deleteMany();
    await WaiterCall.deleteMany();
    await AuditLog.deleteMany();

    // 1. Create Restaurant
    console.log('🏛️ Creating Restaurant...');
    const restaurant = await Restaurant.create({
      name: 'The Royal Spice Lounge & Fine Dine',
      tagline: 'Authentic Indian, Pan-Asian & Tandoor Delicacies',
      description: 'Experience contactless smart QR dining, artisanal handcrafted cuisine, and soothing ambiance in Bengaluru.',
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
      address: {
        street: '42 Indiranagar 100ft Road, Stage 2',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        country: 'India'
      },
      phone: '+91 98450 12345',
      email: 'hello@royalspicebengaluru.com',
      gstNumber: '29AABCR1234F1Z8',
      currency: '₹',
      currencyCode: 'INR',
      taxRate: 5.0, // 5% GST
      serviceChargeRate: 2.5, // 2.5% Service Charge
      packagingCharge: 0,
      upiId: 'royalspice@okhdfcbank',
      upiMerchantName: 'The Royal Spice Lounge',
      openingHours: { open: '11:30 AM', close: '11:45 PM' },
      isAcceptingOrders: true,
      loyaltySettings: {
        pointsPer100: 1,
        pointValue: 1,
        minRedeemPoints: 20
      }
    });

    // 2. Create Users / Staff
    console.log('👥 Creating Staff Users...');
    const owner = await User.create({
      name: 'Vikramaditya Roy',
      email: 'admin@restaurant.com',
      password: 'Admin@123',
      mobile: '+91 98765 00001',
      role: 'owner',
      restaurant: restaurant._id,
      permissions: ['ALL']
    });

    restaurant.owner = owner._id;
    await restaurant.save();

    const manager = await User.create({
      name: 'Ananya Sharma',
      email: 'manager@restaurant.com',
      password: 'Manager@123',
      mobile: '+91 98765 00002',
      role: 'manager',
      restaurant: restaurant._id,
      permissions: ['MANAGE_ORDERS', 'MANAGE_TABLES', 'MANAGE_MENU', 'MANAGE_BILLS', 'VIEW_ANALYTICS']
    });

    const chef = await User.create({
      name: 'Master Chef Sanjeev',
      email: 'kitchen@restaurant.com',
      password: 'Kitchen@123',
      mobile: '+91 98765 00003',
      role: 'kitchen',
      restaurant: restaurant._id,
      permissions: ['VIEW_KDS', 'UPDATE_ITEM_STATUS', 'PRINT_KOT']
    });

    const waiter = await User.create({
      name: 'Rohan Kumar',
      email: 'waiter@restaurant.com',
      password: 'Waiter@123',
      mobile: '+91 98765 00004',
      role: 'waiter',
      restaurant: restaurant._id,
      permissions: ['VIEW_TABLES', 'CALL_ASSISTANCE']
    });

    const cashier = await User.create({
      name: 'Pooja Hegde',
      email: 'cashier@restaurant.com',
      password: 'Cashier@123',
      mobile: '+91 98765 00005',
      role: 'cashier',
      restaurant: restaurant._id,
      permissions: ['MANAGE_PAYMENTS', 'PRINT_BILLS']
    });

    // 3. Create 20 Tables & QR Codes
    console.log('🪑 Creating 20 Dining Tables & QR Codes...');
    const sections = ['Main Hall', 'AC Dining', 'Rooftop Terrace', 'VIP Lounge'];
    const floors = ['Ground Floor', 'First Floor', 'Rooftop'];
    const tables = [];

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    for (let i = 1; i <= 20; i++) {
      const tableNum = i.toString().padStart(2, '0');
      const section = sections[(i - 1) % sections.length];
      const floor = i > 15 ? 'Rooftop' : i > 8 ? 'First Floor' : 'Ground Floor';
      const capacity = i === 5 || i === 12 || i === 18 ? 8 : i % 2 === 0 ? 4 : 2;
      const qrToken = generateTableToken(tableNum);
      const orderUrl = `${clientUrl}/order/${restaurant._id}/${tableNum}?token=${qrToken}`;
      const qrDataUrl = await generateQRCodeDataUrl(orderUrl);

      const table = await Table.create({
        restaurant: restaurant._id,
        tableNumber: tableNum,
        tableName: `Table ${tableNum}`,
        capacity,
        floor,
        section,
        status: i === 2 ? 'OCCUPIED' : i === 4 ? 'FOOD_READY' : i === 6 ? 'BILL_REQUESTED' : 'AVAILABLE',
        qrCodeToken: qrToken,
        qrCodeUrl: orderUrl,
        currentCustomer: i === 2 ? { name: 'Rahul Verma', mobile: '9876543210', joinedAt: new Date() } : null
      });

      await QRCode.create({
        restaurant: restaurant._id,
        table: table._id,
        tableNumber: tableNum,
        token: qrToken,
        orderUrl,
        qrDataUrl,
        scanCount: Math.floor(Math.random() * 50) + 10
      });

      tables.push(table);
    }

    // 4. Create Categories
    console.log('📂 Creating Menu Categories...');
    const categoryData = [
      {
        name: 'Starters & Appetizers',
        icon: 'Flame',
        description: 'Crispy, smoky, and sizzling appetizers to begin your feast.',
        image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
        displayOrder: 1
      },
      {
        name: 'Soups & Salads',
        icon: 'Soup',
        description: 'Heartwarming aromatic soups and farm-fresh organic bowls.',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
        displayOrder: 2
      },
      {
        name: 'Main Course (Curries & Gravies)',
        icon: 'UtensilsCrossed',
        description: 'Rich, slow-simmered regional gravies and Mughlai delights.',
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
        displayOrder: 3
      },
      {
        name: 'Tandoori & Indian Breads',
        icon: 'Cookie',
        description: 'Freshly baked in our charcoal clay oven with pure butter.',
        image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80',
        displayOrder: 4
      },
      {
        name: 'Biryani & Rice Bowls',
        icon: 'Bowl',
        description: 'Fragrant aged Basmati dum biryanis cooked on slow coals with saffron.',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        displayOrder: 5
      },
      {
        name: 'Chinese & Pan-Asian',
        icon: 'Sparkles',
        description: 'Wok-tossed noodles, spicy Manchurian, and sizzling dim sums.',
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
        displayOrder: 6
      },
      {
        name: 'Beverages & Mocktails',
        icon: 'GlassWater',
        description: 'Craft mocktails, creamy lassis, and chilled coolers.',
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
        displayOrder: 7
      },
      {
        name: 'Desserts & Sweets',
        icon: 'Cake',
        description: 'Decadent Indian mithai, warm brownies, and gourmet kulfis.',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
        displayOrder: 8
      }
    ];

    const categories = {};
    for (const cat of categoryData) {
      const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const createdCat = await Category.create({
        restaurant: restaurant._id,
        slug,
        ...cat
      });
      categories[cat.name] = createdCat;
    }

    // 5. Create 36+ Menu Items
    console.log('🍛 Creating 36+ Menu Items...');
    const menuItemsData = [
      // Starters
      {
        category: categories['Starters & Appetizers']._id,
        name: 'Paneer Tikka Angara',
        description: 'Tender cottage cheese cubes marinated in fiery tandoori masala, charred in clay oven with capsicum and onions.',
        shortDescription: 'Smoky tandoori paneer skewers',
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
        price: 280,
        discount: 10,
        foodType: 'veg',
        spicyLevel: 'hot',
        preparationTime: 18,
        ingredients: ['Paneer', 'Yogurt', 'Mustard Oil', 'Degi Mirch', 'Garam Masala'],
        allergens: ['Dairy'],
        calories: 380,
        portionSize: '6 Skewered Pieces',
        isBestseller: true,
        isFeatured: true
      },
      {
        category: categories['Starters & Appetizers']._id,
        name: 'Crispy Corn & Water Chestnut Salt & Pepper',
        description: 'Golden sweet corn kernels and crunchy water chestnuts tossed with cracked black pepper, garlic, and scallions.',
        shortDescription: 'Crunchy wok-tossed sweet corn',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        price: 240,
        discount: 0,
        foodType: 'vegan',
        spicyLevel: 'medium',
        preparationTime: 12,
        ingredients: ['Sweet Corn', 'Water Chestnut', 'Black Pepper', 'Spring Onion'],
        allergens: [],
        calories: 260,
        portionSize: 'Serves 2',
        isBestseller: false
      },
      {
        category: categories['Starters & Appetizers']._id,
        name: 'Murgh Malai Kebab',
        description: 'Succulent chicken breast boneless pieces steeped in cashew cream, green cardamom, and cheese, grilled to melt-in-mouth perfection.',
        shortDescription: 'Creamy cashew grilled chicken',
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
        price: 360,
        discount: 5,
        foodType: 'non-veg',
        spicyLevel: 'mild',
        preparationTime: 20,
        ingredients: ['Chicken Breast', 'Cashew Paste', 'Cream', 'Cheese', 'Cardamom'],
        allergens: ['Dairy', 'Nuts'],
        calories: 450,
        portionSize: '6 Pieces',
        isBestseller: true,
        isFeatured: true
      },
      {
        category: categories['Starters & Appetizers']._id,
        name: 'Dahi Ke Sholay',
        description: 'Crispy fried bread rolls stuffed with spiced hung curd, bell peppers, fresh coriander, and mint chutney dip.',
        shortDescription: 'Golden curd filled crisp rolls',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
        price: 230,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'mild',
        preparationTime: 14,
        ingredients: ['Hung Curd', 'Bread', 'Green Chilli', 'Coriander'],
        allergens: ['Dairy', 'Gluten'],
        calories: 320,
        portionSize: '4 Pieces',
        isBestseller: true
      },
      {
        category: categories['Starters & Appetizers']._id,
        name: 'Amritsari Fish Fry',
        description: 'Fresh river sole fish fillets coated in carom seed (ajwain) spiced gram flour batter, fried crisp and sprinkled with chaat masala.',
        shortDescription: 'Crispy ajwain spiced fish fillets',
        image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
        price: 420,
        discount: 0,
        foodType: 'non-veg',
        spicyLevel: 'hot',
        preparationTime: 16,
        ingredients: ['Sole Fish', 'Gram Flour', 'Ajwain', 'Lemon Juice'],
        allergens: ['Fish'],
        calories: 390,
        portionSize: '5 Pieces',
        isBestseller: false
      },

      // Soups
      {
        category: categories['Soups & Salads']._id,
        name: 'Tomato & Basil Shorba',
        description: 'Velvety roasted plum tomato broth infused with fresh holy basil, cracked peppercorns, and garlic croutons.',
        shortDescription: 'Zesty roasted tomato broth',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
        price: 170,
        discount: 0,
        foodType: 'vegan',
        spicyLevel: 'mild',
        preparationTime: 10,
        ingredients: ['Plum Tomatoes', 'Fresh Basil', 'Garlic', 'Black Pepper'],
        allergens: ['Gluten'],
        calories: 140,
        portionSize: '1 Bowl (250ml)'
      },
      {
        category: categories['Soups & Salads']._id,
        name: 'Manchow Soup (Chicken)',
        description: 'Dark spicy Indo-Chinese chicken broth loaded with finely chopped vegetables, egg ribbons, and topped with crisp fried noodles.',
        shortDescription: 'Spicy garlic ginger chicken soup',
        image: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=600&auto=format&fit=crop&q=80',
        price: 210,
        discount: 0,
        foodType: 'non-veg',
        spicyLevel: 'hot',
        preparationTime: 12,
        ingredients: ['Chicken Stock', 'Egg', 'Garlic', 'Soy Sauce', 'Crispy Noodles'],
        allergens: ['Egg', 'Soy', 'Gluten'],
        calories: 220,
        portionSize: '1 Bowl (250ml)',
        isBestseller: true
      },

      // Main Course (Curries)
      {
        category: categories['Main Course (Curries & Gravies)']._id,
        name: 'Paneer Butter Masala (Chef Signature)',
        description: 'Fresh malai paneer simmered in an indulgent, rich satin-smooth tomato, cashew nut, and butter gravy seasoned with kasuri methi.',
        shortDescription: 'Rich creamy tomato paneer curry',
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
        price: 320,
        discount: 15,
        foodType: 'veg',
        spicyLevel: 'mild',
        preparationTime: 20,
        ingredients: ['Paneer', 'Butter', 'Cashew Paste', 'Tomatoes', 'Kasuri Methi'],
        allergens: ['Dairy', 'Nuts'],
        calories: 520,
        portionSize: 'Serves 2-3',
        isBestseller: true,
        isFeatured: true
      },
      {
        category: categories['Main Course (Curries & Gravies)']._id,
        name: 'Dal Makhani Royal Spices',
        description: 'Whole black lentils and kidney beans slow-cooked overnight for 18 hours on charcoal embers with churned butter and rich cream.',
        shortDescription: 'Authentic 18-hour slow cooked black dal',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
        price: 290,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'mild',
        preparationTime: 15,
        ingredients: ['Black Urad Dal', 'Butter', 'Cream', 'Tomato Puree', 'Kashmiri Mirch'],
        allergens: ['Dairy'],
        calories: 440,
        portionSize: 'Serves 2',
        isBestseller: true,
        isFeatured: true
      },
      {
        category: categories['Main Course (Curries & Gravies)']._id,
        name: 'Butter Chicken Grand Trunk',
        description: 'Charcoal-roasted tandoori chicken cooked in an iconic velvety tomato-fenugreek butter reduction, drizzled with fresh cream.',
        shortDescription: 'Classic creamy tandoori butter chicken',
        image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80',
        price: 410,
        discount: 10,
        foodType: 'non-veg',
        spicyLevel: 'medium',
        preparationTime: 22,
        ingredients: ['Tandoori Chicken', 'Fresh Butter', 'Cashew Nut Gravy', 'Tomatoes', 'Fenugreek'],
        allergens: ['Dairy', 'Nuts'],
        calories: 580,
        portionSize: 'Serves 2-3',
        isBestseller: true,
        isFeatured: true
      },
      {
        category: categories['Main Course (Curries & Gravies)']._id,
        name: 'Rogan Josh Kashmiri',
        description: 'Prime tender lamb shank slow-braised in an aromatic Kashmiri spiced gravy with ratanjot, fennel powder, and dry ginger.',
        shortDescription: 'Traditional Kashmiri slow-cooked lamb curry',
        image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80',
        price: 490,
        discount: 0,
        foodType: 'non-veg',
        spicyLevel: 'hot',
        preparationTime: 25,
        ingredients: ['Mutton Shank', 'Kashmiri Chillies', 'Fennel Powder', 'Mustard Oil'],
        allergens: [],
        calories: 620,
        portionSize: 'Serves 2',
        isBestseller: true
      },
      {
        category: categories['Main Course (Curries & Gravies)']._id,
        name: 'Kadhai Paneer Dhaba Style',
        description: 'Cottage cheese cubes tossed with freshly pounded coriander seeds, dry red chillies, crunchy bell peppers, and onion petals.',
        shortDescription: 'Wok-tossed spicy capsicum paneer',
        image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80',
        price: 310,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'hot',
        preparationTime: 18,
        ingredients: ['Paneer', 'Bell Peppers', 'Whole Coriander', 'Onions', 'Tomatoes'],
        allergens: ['Dairy'],
        calories: 460,
        portionSize: 'Serves 2'
      },

      // Breads
      {
        category: categories['Tandoori & Indian Breads']._id,
        name: 'Butter Naan',
        description: 'Traditional refined flour leavened flatbread baked crisp on tandoor walls, brushed generously with pure dairy butter.',
        shortDescription: 'Fluffy tandoori butter bread',
        image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80',
        price: 60,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'none',
        preparationTime: 6,
        ingredients: ['Refined Flour', 'Butter', 'Yeast'],
        allergens: ['Dairy', 'Gluten'],
        calories: 190,
        portionSize: '1 Piece',
        isBestseller: true
      },
      {
        category: categories['Tandoori & Indian Breads']._id,
        name: 'Garlic & Cheese Naan',
        description: 'Tandoori naan topped with finely minced roasted garlic, stuffed with gooey mozzarella, and garnished with fresh coriander.',
        shortDescription: 'Mozzarella & roasted garlic stuffed naan',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
        price: 95,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'mild',
        preparationTime: 8,
        ingredients: ['Refined Flour', 'Mozzarella Cheese', 'Garlic', 'Butter'],
        allergens: ['Dairy', 'Gluten'],
        calories: 280,
        portionSize: '1 Piece',
        isBestseller: true
      },
      {
        category: categories['Tandoori & Indian Breads']._id,
        name: 'Tandoori Roti (Butter)',
        description: 'Whole wheat flatbread prepared in clay oven and brushed with butter.',
        shortDescription: 'Healthy whole wheat tandoor roti',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
        price: 35,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'none',
        preparationTime: 5,
        ingredients: ['Whole Wheat Flour', 'Butter'],
        allergens: ['Gluten', 'Dairy'],
        calories: 120,
        portionSize: '1 Piece'
      },

      // Biryani & Rice
      {
        category: categories['Biryani & Rice Bowls']._id,
        name: 'Hyderabadi Dum Chicken Biryani',
        description: 'Long-grain aged Basmati rice layered with spiced chicken, caramelized onions, mint, and saffron, slow-cooked in a sealed clay handi.',
        shortDescription: 'Dum cooked saffron chicken biryani',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        price: 380,
        discount: 10,
        foodType: 'non-veg',
        spicyLevel: 'medium',
        preparationTime: 20,
        ingredients: ['Basmati Rice', 'Chicken', 'Saffron', 'Fried Onions', 'Biryani Masala'],
        allergens: ['Dairy'],
        calories: 680,
        portionSize: 'Full Handi with Raita & Salan',
        isBestseller: true,
        isFeatured: true
      },
      {
        category: categories['Biryani & Rice Bowls']._id,
        name: 'Subz Dum Biryani (Vegetarian)',
        description: 'Aromatic basmati rice cooked with fresh seasonal vegetables, paneer cubes, whole spices, and saffron essence.',
        shortDescription: 'Layered spiced vegetable basmati rice',
        image: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=600&auto=format&fit=crop&q=80',
        price: 310,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'medium',
        preparationTime: 18,
        ingredients: ['Basmati Rice', 'Carrots', 'Beans', 'Paneer', 'Saffron', 'Mint'],
        allergens: ['Dairy'],
        calories: 510,
        portionSize: 'Serves 2 with Burani Raita',
        isBestseller: true
      },
      {
        category: categories['Biryani & Rice Bowls']._id,
        name: 'Jeera & Ghee Rice',
        description: 'Fluffy steamed basmati rice tempered with roasted cumin seeds and desi cow ghee.',
        shortDescription: 'Fragrant cumin tempered rice',
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80',
        price: 190,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'none',
        preparationTime: 10,
        ingredients: ['Basmati Rice', 'Cumin', 'Pure Ghee'],
        allergens: ['Dairy'],
        calories: 340,
        portionSize: 'Serves 2'
      },

      // Chinese & Asian
      {
        category: categories['Chinese & Pan-Asian']._id,
        name: 'Chilli Chicken Dry (Indo-Chinese)',
        description: 'Crisp battered chicken chunks tossed with diced bell peppers, green chillies, garlic, and dark soy reduction.',
        shortDescription: 'Spicy wok tossed soy chilli chicken',
        image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&auto=format&fit=crop&q=80',
        price: 340,
        discount: 0,
        foodType: 'non-veg',
        spicyLevel: 'hot',
        preparationTime: 15,
        ingredients: ['Chicken', 'Soy Sauce', 'Green Chillies', 'Capsicum'],
        allergens: ['Soy', 'Gluten', 'Egg'],
        calories: 420,
        portionSize: 'Serves 2',
        isBestseller: true
      },
      {
        category: categories['Chinese & Pan-Asian']._id,
        name: 'Veg Hakka Noodles',
        description: 'Wok-tossed wheat noodles with shredded cabbage, carrots, bell peppers, scallions, and light garlic sesame oil.',
        shortDescription: 'Classic wok-tossed street noodles',
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
        price: 240,
        discount: 0,
        foodType: 'vegan',
        spicyLevel: 'medium',
        preparationTime: 12,
        ingredients: ['Noodles', 'Cabbage', 'Carrots', 'Garlic', 'Sesame Oil'],
        allergens: ['Gluten', 'Soy'],
        calories: 380,
        portionSize: 'Serves 2',
        isBestseller: false
      },

      // Beverages
      {
        category: categories['Beverages & Mocktails']._id,
        name: 'Royal Mango Lassi',
        description: 'Thick churned creamy yogurt blended with sweet Alphonso mango pulp, topped with sliced pistachios and saffron strands.',
        shortDescription: 'Chilled Alphonso mango yogurt shake',
        image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80',
        price: 150,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'none',
        preparationTime: 5,
        ingredients: ['Curd', 'Alphonso Mango Pulp', 'Cardamom', 'Pistachio'],
        allergens: ['Dairy', 'Nuts'],
        calories: 260,
        portionSize: '350ml Tall Glass',
        isBestseller: true
      },
      {
        category: categories['Beverages & Mocktails']._id,
        name: 'Virgin Mojito Fresh Mint Cooler',
        description: 'Crushed garden fresh mint leaves, lime wedges, cane sugar, topped with chilled sparkling soda and crushed ice.',
        shortDescription: 'Refreshing sparkling mint & lime cooler',
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
        price: 140,
        discount: 0,
        foodType: 'vegan',
        spicyLevel: 'none',
        preparationTime: 5,
        ingredients: ['Fresh Mint', 'Lime', 'Soda', 'Cane Sugar'],
        allergens: [],
        calories: 110,
        portionSize: '350ml Glass',
        isBestseller: true
      },
      {
        category: categories['Beverages & Mocktails']._id,
        name: 'Masala Chaas (Spiced Buttermilk)',
        description: 'Refreshing churned spiced buttermilk tempered with roasted cumin, rock salt, ginger, and fresh coriander.',
        shortDescription: 'Digestive chilled spiced buttermilk',
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80',
        price: 80,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'mild',
        preparationTime: 4,
        ingredients: ['Buttermilk', 'Roasted Cumin', 'Black Salt', 'Mint'],
        allergens: ['Dairy'],
        calories: 70,
        portionSize: '300ml Glass'
      },

      // Desserts
      {
        category: categories['Desserts & Sweets']._id,
        name: 'Gulab Jamun with Rabdi',
        description: 'Warm melt-in-mouth khoya dumplings soaked in rose-cardamom syrup, served over thick creamy Lucknowi rabdi and silver varq.',
        shortDescription: 'Warm khoya jamuns with chilled rabdi',
        image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14d48?w=600&auto=format&fit=crop&q=80',
        price: 180,
        discount: 0,
        foodType: 'veg',
        spicyLevel: 'none',
        preparationTime: 6,
        ingredients: ['Khoya', 'Rose Syrup', 'Milk', 'Almonds', 'Cardamom'],
        allergens: ['Dairy', 'Nuts', 'Gluten'],
        calories: 360,
        portionSize: '2 Jamuns with Rabdi',
        isBestseller: true,
        isFeatured: true
      },
      {
        category: categories['Desserts & Sweets']._id,
        name: 'Sizzling S\'mores Chocolate Brownie',
        description: 'Fudgy dark Belgian chocolate brownie served sizzling with a scoop of Madagascar vanilla ice cream and hot chocolate drizzle.',
        shortDescription: 'Hot chocolate fudge brownie with vanilla gelato',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
        price: 240,
        discount: 10,
        foodType: 'veg',
        spicyLevel: 'none',
        preparationTime: 8,
        ingredients: ['Belgian Chocolate', 'Flour', 'Butter', 'Vanilla Gelato'],
        allergens: ['Dairy', 'Gluten'],
        calories: 480,
        portionSize: '1 Sizzler Plate',
        isBestseller: true
      }
    ];

    const createdMenuItems = [];
    for (const item of menuItemsData) {
      const createdItem = await MenuItem.create({
        restaurant: restaurant._id,
        ...item
      });
      createdMenuItems.push(createdItem);
    }

    // 6. Create Inventory Items
    console.log('📦 Creating Inventory Items...');
    const inventoryData = [
      { ingredient: 'Fresh Paneer (Malai Cottage Cheese)', unit: 'kg', currentStock: 18, minimumStock: 8, purchasePrice: 320, category: 'Dairy', supplier: 'Amul Fresh Dairy' },
      { ingredient: 'Fresh Chicken Breast (Boneless)', unit: 'kg', currentStock: 25, minimumStock: 12, purchasePrice: 280, category: 'Meat/Poultry', supplier: 'Venky\'s Premium' },
      { ingredient: 'Mutton Shank (Curry Cut)', unit: 'kg', currentStock: 14, minimumStock: 6, purchasePrice: 750, category: 'Meat/Poultry', supplier: 'Prime Meat Co.' },
      { ingredient: 'Pure Cow Butter', unit: 'kg', currentStock: 15, minimumStock: 5, purchasePrice: 540, category: 'Dairy', supplier: 'Nandini Dairy' },
      { ingredient: 'Fresh Cooking Cream', unit: 'l', currentStock: 12, minimumStock: 4, purchasePrice: 220, category: 'Dairy', supplier: 'Amul Dairy' },
      { ingredient: 'Aged Basmati Rice (Daawat Kohinoor)', unit: 'kg', currentStock: 60, minimumStock: 20, purchasePrice: 140, category: 'Grains & Flour', supplier: 'LT Foods' },
      { ingredient: 'Whole Wheat Flour (Atta)', unit: 'kg', currentStock: 45, minimumStock: 15, purchasePrice: 45, category: 'Grains & Flour', supplier: 'Aashirvaad' },
      { ingredient: 'Cashew Nuts (Whole Kaju)', unit: 'kg', currentStock: 8, minimumStock: 3, purchasePrice: 850, category: 'Produce', supplier: 'Mangalore Cashews' },
      { ingredient: 'Plum Tomatoes (Fresh)', unit: 'kg', currentStock: 30, minimumStock: 10, purchasePrice: 35, category: 'Produce', supplier: 'Local APMC Mandi' },
      { ingredient: 'Onions (Nashik Red)', unit: 'kg', currentStock: 40, minimumStock: 15, purchasePrice: 30, category: 'Produce', supplier: 'Local APMC Mandi' },
      { ingredient: 'Kashmiri Saffron (Kesar)', unit: 'g', currentStock: 25, minimumStock: 10, purchasePrice: 280, category: 'Spices & Condiments', supplier: 'Pampore Saffron Co.' },
      { ingredient: 'Cardamom & Whole Spices Pack', unit: 'kg', currentStock: 4, minimumStock: 1.5, purchasePrice: 2200, category: 'Spices & Condiments', supplier: 'Kerala Spice Traders' }
    ];

    for (const inv of inventoryData) {
      await InventoryItem.create({
        restaurant: restaurant._id,
        ...inv
      });
    }

    // 7. Create Active Offers & Coupons
    console.log('🏷️ Creating Discount Coupons & Offers...');
    const offersData = [
      {
        name: 'Welcome Special',
        code: 'WELCOME50',
        description: 'Flat ₹50 OFF on your first dining order above ₹300',
        discountType: 'flat',
        discountValue: 50,
        minOrderValue: 300,
        maxDiscount: 50,
        isActive: true
      },
      {
        name: 'Royal Feast 15% OFF',
        code: 'ROYAL15',
        description: 'Get 15% discount on total bill up to ₹150 for orders above ₹600',
        discountType: 'percentage',
        discountValue: 15,
        minOrderValue: 600,
        maxDiscount: 150,
        isActive: true
      },
      {
        name: 'Weekend Mega Discount',
        code: 'FEAST100',
        description: 'Flat ₹100 instant discount on bill above ₹800',
        discountType: 'flat',
        discountValue: 100,
        minOrderValue: 800,
        maxDiscount: 100,
        isActive: true
      }
    ];

    for (const off of offersData) {
      await Offer.create({
        restaurant: restaurant._id,
        ...off
      });
    }

    // 8. Create Sample Customers
    console.log('📱 Creating Sample Customers...');
    const customersData = [
      { name: 'Rahul Verma', mobile: '9876543210', visitsCount: 5, totalSpent: 4250, loyaltyPoints: 42, lastTableNumber: '02' },
      { name: 'Priya Sundaram', mobile: '9845011223', visitsCount: 3, totalSpent: 2890, loyaltyPoints: 28, lastTableNumber: '08' },
      { name: 'Dr. Arjun Mehta', mobile: '9731298765', visitsCount: 8, totalSpent: 9120, loyaltyPoints: 91, lastTableNumber: '12' },
      { name: 'Sneha Patel', mobile: '9900144556', visitsCount: 2, totalSpent: 1650, loyaltyPoints: 16, lastTableNumber: '05' }
    ];

    for (const cust of customersData) {
      await Customer.create({
        restaurant: restaurant._id,
        ...cust
      });
    }

    // 9. Create Historical & Active Sample Orders for rich charts and KDS
    console.log('🧾 Creating Sample Orders, Invoices & Payments...');
    const samplePaneer = createdMenuItems.find(m => m.name.includes('Paneer Butter'));
    const sampleNaan = createdMenuItems.find(m => m.name.includes('Butter Naan'));
    const sampleLassi = createdMenuItems.find(m => m.name.includes('Lassi'));
    const sampleBiryani = createdMenuItems.find(m => m.name.includes('Biryani'));
    const sampleDessert = createdMenuItems.find(m => m.name.includes('Gulab Jamun'));

    const pastOrdersInfo = [
      {
        orderNumber: 'ORD-20260826-0001',
        tableNumber: '02',
        tableId: tables[1]._id,
        customer: { name: 'Rahul Verma', mobile: '9876543210' },
        items: [
          { menuItem: samplePaneer._id, name: samplePaneer.name, price: 272, quantity: 2, itemTotal: 544, foodType: 'veg', spicyLevel: 'mild', specialInstructions: 'Less spicy please' },
          { menuItem: sampleNaan._id, name: sampleNaan.name, price: 60, quantity: 4, itemTotal: 240, foodType: 'veg', spicyLevel: 'none' },
          { menuItem: sampleLassi._id, name: sampleLassi.name, price: 150, quantity: 2, itemTotal: 300, foodType: 'veg', spicyLevel: 'none' }
        ],
        subtotal: 1084,
        discount: 50,
        couponCode: 'WELCOME50',
        tax: 51.70,
        serviceCharge: 25.85,
        grandTotal: 1111.55,
        orderStatus: 'Preparing',
        paymentStatus: 'Pending',
        createdAt: new Date(Date.now() - 25 * 60 * 1000)
      },
      {
        orderNumber: 'ORD-20260826-0002',
        tableNumber: '04',
        tableId: tables[3]._id,
        customer: { name: 'Priya Sundaram', mobile: '9845011223' },
        items: [
          { menuItem: sampleBiryani._id, name: sampleBiryani.name, price: 342, quantity: 2, itemTotal: 684, foodType: 'non-veg', spicyLevel: 'medium' },
          { menuItem: sampleDessert._id, name: sampleDessert.name, price: 180, quantity: 2, itemTotal: 360, foodType: 'veg', spicyLevel: 'none' }
        ],
        subtotal: 1044,
        discount: 100,
        couponCode: 'FEAST100',
        tax: 47.20,
        serviceCharge: 23.60,
        grandTotal: 1014.80,
        orderStatus: 'Ready',
        paymentStatus: 'Pending',
        createdAt: new Date(Date.now() - 40 * 60 * 1000)
      },
      {
        orderNumber: 'ORD-20260826-0003',
        tableNumber: '08',
        tableId: tables[7]._id,
        customer: { name: 'Dr. Arjun Mehta', mobile: '9731298765' },
        items: [
          { menuItem: samplePaneer._id, name: samplePaneer.name, price: 272, quantity: 1, itemTotal: 272, foodType: 'veg', spicyLevel: 'mild' },
          { menuItem: sampleNaan._id, name: sampleNaan.name, price: 60, quantity: 2, itemTotal: 120, foodType: 'veg', spicyLevel: 'none' }
        ],
        subtotal: 392,
        discount: 0,
        tax: 19.60,
        serviceCharge: 9.80,
        grandTotal: 421.40,
        orderStatus: 'Completed',
        paymentStatus: 'Paid',
        paymentMethod: 'UPI',
        createdAt: new Date(Date.now() - 90 * 60 * 1000)
      }
    ];

    for (const ord of pastOrdersInfo) {
      const order = await Order.create({
        restaurant: restaurant._id,
        table: ord.tableId,
        ...ord
      });

      if (ord.orderStatus === 'Preparing') {
        tables[1].currentOrder = order._id;
        await tables[1].save();
      }

      if (ord.paymentStatus === 'Paid') {
        // Generate Invoice & Payment record
        const invoice = await Invoice.create({
          invoiceNumber: `INV-20260826-0001`,
          order: order._id,
          orderNumber: order.orderNumber,
          restaurant: restaurant._id,
          tableNumber: ord.tableNumber,
          customer: ord.customer,
          restaurantDetails: {
            name: restaurant.name,
            address: restaurant.address,
            phone: restaurant.phone,
            email: restaurant.email,
            gstNumber: restaurant.gstNumber,
            upiId: restaurant.upiId
          },
          items: ord.items,
          subtotal: ord.subtotal,
          discount: ord.discount,
          tax: ord.tax,
          serviceCharge: ord.serviceCharge,
          grandTotal: ord.grandTotal,
          paymentStatus: 'Paid',
          paymentMethod: 'UPI',
          paidAt: new Date()
        });

        await Payment.create({
          paymentNumber: `PAY-20260826-0001`,
          order: order._id,
          invoice: invoice._id,
          restaurant: restaurant._id,
          amount: ord.grandTotal,
          paymentMethod: 'UPI',
          paymentStatus: 'Success',
          upiReference: 'UPI-HDFC-99882211',
          transactionId: 'TXN-99882211'
        });
      }
    }

    // 10. Sample Customer Feedback
    console.log('⭐ Creating Sample Feedback Reviews...');
    const feedbackList = [
      {
        restaurant: restaurant._id,
        tableNumber: '08',
        customerName: 'Dr. Arjun Mehta',
        customerMobile: '9731298765',
        foodRating: 5,
        serviceRating: 5,
        ambienceRating: 5,
        overallRating: 5,
        comment: 'Outstanding Dal Makhani and Paneer Butter Masala! QR ordering was super smooth and fast.',
        tags: ['Delicious Food', 'Quick Service', 'Great Ambience']
      },
      {
        restaurant: restaurant._id,
        tableNumber: '12',
        customerName: 'Sneha Patel',
        customerMobile: '9900144556',
        foodRating: 5,
        serviceRating: 4,
        ambienceRating: 5,
        overallRating: 4.8,
        comment: 'Loved the Mango Lassi and Dum Biryani. Very polite staff.',
        tags: ['Great Taste', 'Helpful Staff']
      }
    ];

    for (const fb of feedbackList) {
      await Feedback.create(fb);
    }

    console.log('✅ Database seeded successfully with full demo data!');
    console.log('----------------------------------------------------');
    console.log('🔑 DEMO CREDENTIALS:');
    console.log('👑 Admin / Owner:  admin@restaurant.com   / Admin@123');
    console.log('👔 Manager:        manager@restaurant.com / Manager@123');
    console.log('🍳 Kitchen Chef:    kitchen@restaurant.com / Kitchen@123');
    console.log('🤵 Waiter:         waiter@restaurant.com  / Waiter@123');
    console.log('💰 Cashier:        cashier@restaurant.com / Cashier@123');
    console.log(`🪑 Restaurant ID:  ${restaurant._id}`);
    console.log('----------------------------------------------------');

    if (require.main === module) {
      await closeDB();
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
