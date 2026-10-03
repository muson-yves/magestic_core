const express   = require('express');
const cors      = require('cors');
const session   = require('express-session');
const bcrypt    = require('bcryptjs');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const mongoose  = require('./db');
require('dotenv').config();

let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('REPLACE')) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

const { Schema, model, Types } = mongoose;

// ── Schemas ─────────────────────────────────────────────────
const AdminSchema = new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});
const Admin = model('Admin', AdminSchema);

const BuyerSchema = new Schema({
  name:      { type: String, required: true },
  email:     { type: String, unique: true, required: true },
  password:  { type: String, required: true },
  address:   { type: String, default: '' },
}, { timestamps: true });
const Buyer = model('Buyer', BuyerSchema);

const ProductSchema = new Schema({
  name:           { type: String, required: true },
  description:    { type: String, default: '' },
  price:          { type: Number, required: true },
  original_price: { type: Number, default: null },
  category:       { type: String, enum: ['cameras','headphones','gaming_pc','laptops','speakers','others'], required: true },
  image:          { type: String, default: null },
  extra_images:   [{ type: String }],
  stock:          { type: Number, default: 0 },
  featured:       { type: Boolean, default: false },
}, { timestamps: true });
const Product = model('Product', ProductSchema);

const ReviewSchema = new Schema({
  product_id: { type: Types.ObjectId, ref: 'Product', required: true },
  buyer_id:   { type: Types.ObjectId, ref: 'Buyer',   required: true },
  rating:     { type: Number, min: 1, max: 5, required: true },
  comment:    { type: String, default: '' },
}, { timestamps: true });
ReviewSchema.index({ product_id: 1, buyer_id: 1 }, { unique: true });
const Review = model('Review', ReviewSchema);

const CartItemSchema = new Schema({
  buyer_id:   { type: Types.ObjectId, ref: 'Buyer',   required: true },
  product_id: { type: Types.ObjectId, ref: 'Product', required: true },
  qty:        { type: Number, default: 1 },
});
CartItemSchema.index({ buyer_id: 1, product_id: 1 }, { unique: true });
const CartItem = model('CartItem', CartItemSchema);

const WishlistItemSchema = new Schema({
  buyer_id:   { type: Types.ObjectId, ref: 'Buyer',   required: true },
  product_id: { type: Types.ObjectId, ref: 'Product', required: true },
});
WishlistItemSchema.index({ buyer_id: 1, product_id: 1 }, { unique: true });
const WishlistItem = model('WishlistItem', WishlistItemSchema);

const OrderSchema = new Schema({
  buyer_id: { type: Types.ObjectId, ref: 'Buyer', required: true },
  total:    { type: Number, required: true },
  address:  { type: String, required: true },
  status:   { type: String, enum: ['pending','processing','shipped','delivered','cancelled'], default: 'pending' },
  items: [{
    product_id: { type: Types.ObjectId, ref: 'Product' },
    name:  String,
    price: Number,
    qty:   Number,
    image: String,
  }],
}, { timestamps: true });
const Order = model('Order', OrderSchema);

// ── Seed default admin ───────────────────────────────────────
async function seedAdmin() {
  const exists = await Admin.findOne({ username: 'magestic' });
  if (!exists) {
    const hash = await bcrypt.hash('core123', 12);
    await Admin.create({ username: 'magestic', password: hash });
    console.log('✅ Default admin created');
  }
}
mongoose.connection.once('open', seedAdmin);

// ── Express setup ────────────────────────────────────────────
const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 },
}));

// ── Multer ───────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => cb(null, `prod_${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg','.jpeg','.png','.webp'].includes(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Only JPG/PNG/WEBP allowed'));
  },
});
const uploadFields = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 4 }]);

// ── Guards ───────────────────────────────────────────────────
const requireAdmin = (req, res, next) => req.session.adminId ? next() : res.status(401).json({ error: 'Unauthorized' });
const requireBuyer = (req, res, next) => req.session.buyerId ? next() : res.status(401).json({ error: 'Login required' });

// helper: attach avg_rating + review_count to product plain objects
async function withRatings(products) {
  const ids = products.map(p => p._id);
  const agg = await Review.aggregate([
    { $match: { product_id: { $in: ids } } },
    { $group: { _id: '$product_id', avg_rating: { $avg: '$rating' }, review_count: { $sum: 1 } } },
  ]);
  const map = {};
  agg.forEach(a => { map[a._id.toString()] = a; });
  return products.map(p => {
    const r = map[p._id.toString()] || { avg_rating: 0, review_count: 0 };
    return { ...p, id: p._id, avg_rating: Number(r.avg_rating).toFixed(2), review_count: r.review_count };
  });
}

// ══════════════════════════════════════════════════════════════
//  ADMIN AUTH
// ══════════════════════════════════════════════════════════════
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin || !(await bcrypt.compare(password, admin.password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  req.session.adminId = admin._id.toString();
  res.json({ message: 'Logged in' });
});
app.post('/api/admin/logout', (req, res) => { req.session.destroy(); res.json({ message: 'Logged out' }); });
app.get('/api/admin/me', (req, res) => res.json({ loggedIn: !!req.session.adminId }));

// ══════════════════════════════════════════════════════════════
//  BUYER AUTH
// ══════════════════════════════════════════════════════════════
app.post('/api/buyer/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (await Buyer.findOne({ email })) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 12);
  const buyer = await Buyer.create({ name, email, password: hash });
  req.session.buyerId = buyer._id.toString();
  req.session.buyerName = name;
  res.json({ id: buyer._id, name, email });
});

app.post('/api/buyer/login', async (req, res) => {
  const { email, password } = req.body;
  const buyer = await Buyer.findOne({ email });
  if (!buyer || !(await bcrypt.compare(password, buyer.password)))
    return res.status(401).json({ error: 'Invalid email or password' });
  req.session.buyerId = buyer._id.toString();
  req.session.buyerName = buyer.name;
  res.json({ id: buyer._id, name: buyer.name, email: buyer.email });
});

app.post('/api/buyer/logout', (req, res) => { req.session.destroy(); res.json({ message: 'Logged out' }); });

app.get('/api/buyer/me', async (req, res) => {
  if (!req.session.buyerId) return res.json({ loggedIn: false });
  const buyer = await Buyer.findById(req.session.buyerId).select('name email address');
  if (!buyer) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, id: buyer._id, name: buyer.name, email: buyer.email, address: buyer.address });
});

app.put('/api/buyer/profile', requireBuyer, async (req, res) => {
  const { name, address } = req.body;
  await Buyer.findByIdAndUpdate(req.session.buyerId, { name, address });
  req.session.buyerName = name;
  res.json({ message: 'Profile updated' });
});

// ══════════════════════════════════════════════════════════════
//  PRODUCTS — PUBLIC
// ══════════════════════════════════════════════════════════════
app.get('/api/products/featured', async (req, res) => {
  const products = await Product.find({ featured: true }).sort({ createdAt: -1 }).limit(8).lean();
  res.json(await withRatings(products));
});

app.get('/api/products', async (req, res) => {
  const { cat, q, sort } = req.query;
  const allowed = ['cameras','headphones','gaming_pc','laptops','speakers','others'];
  const filter = {};
  if (cat && allowed.includes(cat)) filter.category = cat;
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];
  let sortObj = { createdAt: -1 };
  if (sort === 'price_asc')  sortObj = { price: 1 };
  if (sort === 'price_desc') sortObj = { price: -1 };
  const products = await Product.find(filter).sort(sortObj).lean();
  if (sort === 'rating') {
    const rated = await withRatings(products);
    return res.json(rated.sort((a, b) => b.avg_rating - a.avg_rating));
  }
  res.json(await withRatings(products));
});

app.get('/api/products/:id', async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ error: 'Not found' });
  const [rated] = await withRatings([product]);
  res.json(rated);
});

// ══════════════════════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════════════════════
app.get('/api/products/:id/reviews', async (req, res) => {
  const reviews = await Review.find({ product_id: req.params.id })
    .populate('buyer_id', 'name').sort({ createdAt: -1 }).lean();
  res.json(reviews.map(r => ({ ...r, id: r._id, buyer_name: r.buyer_id?.name, buyer_id: r.buyer_id?._id })));
});

app.post('/api/products/:id/reviews', requireBuyer, async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
  await Review.findOneAndUpdate(
    { product_id: req.params.id, buyer_id: req.session.buyerId },
    { rating, comment: comment || '' },
    { upsert: true, new: true }
  );
  res.json({ message: 'Review saved' });
});

// ══════════════════════════════════════════════════════════════
//  CART
// ══════════════════════════════════════════════════════════════
app.get('/api/cart', requireBuyer, async (req, res) => {
  const items = await CartItem.find({ buyer_id: req.session.buyerId }).populate('product_id').lean();
  res.json(items.map(c => ({
    id: c._id,
    qty: c.qty,
    product_id: c.product_id._id,
    name: c.product_id.name,
    price: c.product_id.price,
    original_price: c.product_id.original_price,
    image: c.product_id.image,
    stock: c.product_id.stock,
  })));
});

app.post('/api/cart', requireBuyer, async (req, res) => {
  const { product_id, qty = 1 } = req.body;
  const prod = await Product.findById(product_id);
  if (!prod || prod.stock < 1) return res.status(400).json({ error: 'Out of stock' });
  await CartItem.findOneAndUpdate(
    { buyer_id: req.session.buyerId, product_id },
    { $inc: { qty } },
    { upsert: true }
  );
  res.json({ message: 'Added to cart' });
});

app.put('/api/cart/:id', requireBuyer, async (req, res) => {
  const { qty } = req.body;
  if (qty < 1) await CartItem.findOneAndDelete({ _id: req.params.id, buyer_id: req.session.buyerId });
  else         await CartItem.findOneAndUpdate({ _id: req.params.id, buyer_id: req.session.buyerId }, { qty });
  res.json({ message: 'Updated' });
});

app.delete('/api/cart/:id', requireBuyer, async (req, res) => {
  await CartItem.findOneAndDelete({ _id: req.params.id, buyer_id: req.session.buyerId });
  res.json({ message: 'Removed' });
});

app.delete('/api/cart', requireBuyer, async (req, res) => {
  await CartItem.deleteMany({ buyer_id: req.session.buyerId });
  res.json({ message: 'Cart cleared' });
});

// ══════════════════════════════════════════════════════════════
//  WISHLIST
// ══════════════════════════════════════════════════════════════
app.get('/api/wishlist', requireBuyer, async (req, res) => {
  const items = await WishlistItem.find({ buyer_id: req.session.buyerId }).populate('product_id').lean();
  const products = items.map(w => ({ ...w.product_id, _id: w.product_id._id }));
  const rated = await withRatings(products);
  res.json(rated.map((p, i) => ({ ...p, id: p._id, product_id: p._id, wishlist_id: items[i]._id })));
});

app.post('/api/wishlist', requireBuyer, async (req, res) => {
  const { product_id } = req.body;
  await WishlistItem.findOneAndUpdate(
    { buyer_id: req.session.buyerId, product_id },
    {},
    { upsert: true }
  );
  res.json({ message: 'Added to wishlist' });
});

app.delete('/api/wishlist/:product_id', requireBuyer, async (req, res) => {
  await WishlistItem.findOneAndDelete({ buyer_id: req.session.buyerId, product_id: req.params.product_id });
  res.json({ message: 'Removed' });
});

// ══════════════════════════════════════════════════════════════
//  PAYMENT
// ══════════════════════════════════════════════════════════════
app.post('/api/payment/create-intent', requireBuyer, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payment not configured. Add STRIPE_SECRET_KEY to backend/.env' });
  const cartItems = await CartItem.find({ buyer_id: req.session.buyerId }).populate('product_id').lean();
  if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });
  const subtotal = cartItems.reduce((s, c) => s + c.product_id.price * c.qty, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const totalCents = Math.round((subtotal + shipping) * 100);
  const intent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
  });
  res.json({ clientSecret: intent.client_secret });
});

// ══════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════
app.post('/api/orders', requireBuyer, async (req, res) => {
  const { address, paymentIntentId } = req.body;
  if (!address) return res.status(400).json({ error: 'Delivery address required' });
  if (!paymentIntentId) return res.status(400).json({ error: 'Payment required' });
  if (!stripe) return res.status(503).json({ error: 'Payment not configured' });
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== 'succeeded') return res.status(400).json({ error: 'Payment not completed' });
  const cartItems = await CartItem.find({ buyer_id: req.session.buyerId }).populate('product_id').lean();
  if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });
  for (const c of cartItems)
    if (c.product_id.stock < c.qty) return res.status(400).json({ error: `"${c.product_id.name}" has insufficient stock` });
  const total = cartItems.reduce((s, c) => s + c.product_id.price * c.qty, 0);
  const items = cartItems.map(c => ({ product_id: c.product_id._id, name: c.product_id.name, price: c.product_id.price, qty: c.qty, image: c.product_id.image }));
  const order = await Order.create({ buyer_id: req.session.buyerId, total, address, items });
  for (const c of cartItems)
    await Product.findByIdAndUpdate(c.product_id._id, { $inc: { stock: -c.qty } });
  await CartItem.deleteMany({ buyer_id: req.session.buyerId });
  res.json({ message: 'Order placed', orderId: order._id });
});

app.get('/api/orders', requireBuyer, async (req, res) => {
  const orders = await Order.find({ buyer_id: req.session.buyerId }).sort({ createdAt: -1 }).lean();
  res.json(orders.map(o => ({ ...o, id: o._id })));
});

app.get('/api/orders/:id', requireBuyer, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, buyer_id: req.session.buyerId }).lean();
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json({ ...order, id: order._id });
});

// ══════════════════════════════════════════════════════════════
//  ADMIN — PRODUCTS
// ══════════════════════════════════════════════════════════════
app.post('/api/admin/products', requireAdmin, uploadFields, async (req, res) => {
  const { name, description, price, original_price, category, stock, featured } = req.body;
  const allowed = ['cameras','headphones','gaming_pc','laptops','speakers','others'];
  if (!name || !allowed.includes(category) || isNaN(price)) return res.status(400).json({ error: 'Invalid data' });
  const image = req.files?.image?.[0]?.filename || null;
  const extra_images = (req.files?.images || []).map(f => f.filename);
  await Product.create({ name, description: description||'', price, original_price: original_price||null, category, image, extra_images, stock: stock||0, featured: featured === '1' });
  res.json({ message: 'Product added' });
});

app.put('/api/admin/products/:id', requireAdmin, uploadFields, async (req, res) => {
  const { name, description, price, original_price, category, stock, featured, delete_images } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  if (req.files?.image?.[0]) {
    if (product.image) { const p = path.join(__dirname,'uploads',product.image); if(fs.existsSync(p)) fs.unlinkSync(p); }
    product.image = req.files.image[0].filename;
  }
  const toDelete = delete_images ? JSON.parse(delete_images) : [];
  for (const fn of toDelete) {
    const p = path.join(__dirname,'uploads',fn); if(fs.existsSync(p)) fs.unlinkSync(p);
  }
  product.extra_images = product.extra_images.filter(f => !toDelete.includes(f));
  const newExtras = (req.files?.images || []).map(f => f.filename);
  product.extra_images = [...product.extra_images, ...newExtras].slice(0, 4);
  product.name = name; product.description = description||''; product.price = price;
  product.original_price = original_price||null; product.category = category;
  product.stock = stock||0; product.featured = featured === '1';
  await product.save();
  res.json({ message: 'Updated' });
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  if (product.image) { const p = path.join(__dirname,'uploads',product.image); if(fs.existsSync(p)) fs.unlinkSync(p); }
  for (const fn of product.extra_images) { const p = path.join(__dirname,'uploads',fn); if(fs.existsSync(p)) fs.unlinkSync(p); }
  await Product.findByIdAndDelete(req.params.id);
  await Review.deleteMany({ product_id: req.params.id });
  await CartItem.deleteMany({ product_id: req.params.id });
  await WishlistItem.deleteMany({ product_id: req.params.id });
  res.json({ message: 'Deleted' });
});

// ══════════════════════════════════════════════════════════════
//  ADMIN — ORDERS
// ══════════════════════════════════════════════════════════════
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  const orders = await Order.find().populate('buyer_id', 'name email').sort({ createdAt: -1 }).lean();
  res.json(orders.map(o => ({ ...o, id: o._id, buyer_name: o.buyer_id?.name, buyer_email: o.buyer_id?.email })));
});

app.put('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending','processing','shipped','delivered','cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  await Order.findByIdAndUpdate(req.params.id, { status });
  res.json({ message: 'Status updated' });
});

// ══════════════════════════════════════════════════════════════
//  ADMIN — BUYERS
// ══════════════════════════════════════════════════════════════
app.get('/api/admin/buyers', requireAdmin, async (req, res) => {
  const buyers = await Buyer.find().select('name email address createdAt').sort({ createdAt: -1 }).lean();
  res.json(buyers.map(b => ({ ...b, id: b._id, created_at: b.createdAt })));
});

// ══════════════════════════════════════════════════════════════
//  ADMIN — STATS
// ══════════════════════════════════════════════════════════════
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  const [products, buyers, orders, revenueAgg, outOfStock] = await Promise.all([
    Product.countDocuments(),
    Buyer.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Product.countDocuments({ stock: 0 }),
  ]);
  res.json({ products, buyers, orders, revenue: revenueAgg[0]?.total || 0, outOfStock });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Majestic Core API running on http://localhost:${PORT}`));
