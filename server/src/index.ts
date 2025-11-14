import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import {
  readMenu,
  readOrders,
  writeOrders,
  readCompletedOrders,
  writeCompletedOrders,
  writeMenu,
} from './dataManager.js';
import {
  readUsersByBranch,
  writeUsersByBranch,
  readMenuByBranch,
  writeMenuByBranch,
  readOrdersByBranch,
  writeOrdersByBranch,
  readCompletedOrdersByBranch,
  writeCompletedOrdersByBranch,
  readBranches
} from './dataManager.js';
import {
  getUserByPin,
  getUserByRole,
  getAllUsers,
  createUser,
  deleteUser,
} from './auth.js';
import type { Order, OrderItem, OrderStatus, DailyReport } from './types.js';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'restaurant-secret-key-change-in-production';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const CLIENT_BUILD_PATH =
  process.env.CLIENT_BUILD_PATH || join(__dirname, '../../client/dist');

// Frontend domain allow-list (CORS)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://harmonious-florentine-735f60.netlify.app', // Netlify front-end
  CORS_ORIGIN,
].filter(Boolean) as string[];

// Behind proxy (Railway) için secure cookie desteği
app.set('trust proxy', 1);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Origin yoksa (Postman vs.) izin ver
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      // Netlify (A domaini) -> Railway (B domaini) için cross-site cookie
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

// WebSocket clients - branchId ile eşleştirilmiş
const clients = new Map<any, string>();

wss.on('connection', (ws: any, req: any) => {
  // WebSocket bağlantısında branchId bilgisi alınmalı
  let branchId = 'default';
  
  try {
    if (req.url) {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      branchId = url.searchParams.get('branchId') || 'default';
    }
  } catch (error) {
    console.error('Failed to parse WebSocket URL:', error);
  }
  
  clients.set(ws, branchId);
  console.log(`WebSocket connected for branch: ${branchId}`);

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Belirli bir branch'e mesaj gönder
function broadcastToBranch(branchId: string, data: any) {
  const message = JSON.stringify(data);
  clients.forEach((clientBranchId, client) => {
    // Map.forEach: (value, key) -> (branchId, client)
    if (clientBranchId === branchId && (client as any).readyState === 1) {
      (client as any).send(message);
    }
  });
}

// Tüm branch'lere mesaj gönder (eski davranış için)
function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach((clientBranchId, client) => {
    // Map.forEach: (value, key) -> (branchId, client)
    if ((client as any).readyState === 1) {
      (client as any).send(message);
    }
  });
}

function getBranchId(req: any): string {
  // Önce session'dan al, yoksa body'den, yoksa query'den, yoksa default
  return req.session?.branchId || req.body?.branchId || req.query?.branchId || 'default';
}

// BranchId validasyonu
function validateBranchId(branchId: string | undefined): string {
  if (!branchId) {
    throw new Error('branchId is required');
  }
  return branchId;
}

// Branches endpoint
app.get('/api/branches', (req, res) => {
  const branches = readBranches();
  res.json(branches);
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { pin, branchId } = req.body;

  if (!pin) {
    return res.status(400).json({ error: 'PIN/Şifre gerekli' });
  }

  if (!branchId) {
    return res.status(400).json({ error: 'branchId gerekli' });
  }

  // Özel kelimeler kontrolü (mutfak, bar, kasa)
  if (pin.toLowerCase() === 'mutfak') {
    const user = getUserByRole('kitchen', branchId);
    if (user) {
      (req.session as any).branchId = branchId;
      (req.session as any).user = user;
      return res.json({ user });
    }
    return res.status(401).json({ error: 'Geçersiz PIN/Şifre veya şube' });
  }

  if (pin.toLowerCase() === 'bar') {
    const user = getUserByRole('bar', branchId);
    if (user) {
      (req.session as any).branchId = branchId;
      (req.session as any).user = user;
      return res.json({ user });
    }
    return res.status(401).json({ error: 'Geçersiz PIN/Şifre veya şube' });
  }

  if (pin.toLowerCase() === 'kasa') {
    const user = getUserByRole('cashier', branchId);
    if (user) {
      (req.session as any).branchId = branchId;
      (req.session as any).user = user;
      return res.json({ user });
    }
    return res.status(401).json({ error: 'Geçersiz PIN/Şifre veya şube' });
  }

  // PIN ve branchId ile kullanıcı bulma
  const user = getUserByPin(pin, branchId);
  if (!user) {
    return res.status(401).json({ error: 'Geçersiz PIN/Şifre veya şube' });
  }

  // Branch attach
  (req.session as any).branchId = branchId;
  (req.session as any).user = user;
  return res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = (req.session as any)?.user;
  if (user) {
    res.json({ user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Admin routes
app.get('/api/admin/users', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const users = getAllUsers(branchId);
  const staff = users.filter((u) => u.role === 'waiter' || u.role === 'cashier');
  res.json(staff);
});

app.post('/api/admin/users', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const { username, pin, role } = req.body;
  if (!username || !pin || !role) {
    return res
      .status(400)
      .json({ error: 'Kullanıcı adı, PIN ve rol gerekli' });
  }

  if (role !== 'waiter' && role !== 'cashier') {
    return res.status(400).json({ error: 'Geçersiz rol (waiter veya cashier olmalı)' });
  }

  try {
    const newUser = createUser(username, pin, role, branchId);
    broadcastToBranch(branchId, { type: 'USER_CREATED', user: newUser });
    res.json(newUser);
  } catch (error: any) {
    if (error.message === 'PIN already in use') {
      return res.status(400).json({ error: 'PIN already in use' });
    }
    return res.status(500).json({ error: error.message || 'Kullanıcı eklenemedi' });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const { id } = req.params;
  const { role } = req.query;

  if (role !== 'waiter' && role !== 'cashier') {
    return res.status(400).json({ error: 'Geçersiz rol' });
  }

  const success = deleteUser(id, role as 'waiter' | 'cashier', branchId);
  if (success) {
    broadcastToBranch(branchId, { type: 'USER_DELETED', userId: id });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  }
});

app.post('/api/admin/switch', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const { role } = req.body;
  let targetUser;

  if (role === 'kitchen') {
    targetUser = getUserByRole('kitchen', branchId);
  } else if (role === 'bar') {
    targetUser = getUserByRole('bar', branchId);
  } else if (role === 'cashier') {
    targetUser = getUserByRole('cashier', branchId);
  } else if (role === 'admin') {
    targetUser = user;
  } else {
    return res.status(400).json({ error: 'Geçersiz rol' });
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  }

  (req.session as any).user = targetUser;
  res.json({ user: targetUser });
});

// Admin branch switch endpoint (PIN doğrulama ile)
app.post('/api/admin/switch-branch', async (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { branchId, pin } = req.body;
  if (!branchId || !pin) {
    return res.status(400).json({ error: 'branchId ve PIN gerekli' });
  }

  // Admin PIN'ini doğrula
  const adminUser = getUserByPin(pin, branchId);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(401).json({ error: 'Geçersiz PIN veya şube' });
  }

  // Session'ı güncelle
  (req.session as any).branchId = branchId;
  (req.session as any).user = adminUser;
  res.json({ user: adminUser, branchId });
});

// Menu routes
app.get('/api/menu', (req, res) => {
  const branchId = validateBranchId(getBranchId(req));
  const menu = readMenuByBranch(branchId);
  res.json(menu);
});

// Admin - Menü yönetimi
app.post('/api/admin/menu', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const { name, price, category, menuCategory, items, extras } = req.body;

  if (!name || !price || !category) {
    return res
      .status(400)
      .json({ error: 'Ürün adı, fiyat ve kategori gerekli' });
  }

  const menu = readMenuByBranch(branchId);
  const newItem: any = {
    id: Date.now().toString(),
    name,
    price: parseFloat(price),
    category,
    menuCategory: menuCategory || category,
    branchId: branchId, // Zorunlu
  };

  // Kampanya menüsü ise items ekle
  if (category === 'campaign' && items && Array.isArray(items)) {
    newItem.items = items;
  }

  // Extras ekle (opsiyonel)
  if (extras && extras.trim()) {
    newItem.extras = extras.trim();
  }

  menu.push(newItem);
  writeMenuByBranch(branchId, menu);

  broadcastToBranch(branchId, { type: 'MENU_UPDATED', menu });
  res.json(newItem);
});

app.put('/api/admin/menu/:id', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const { id } = req.params;
  const { name, price, category, menuCategory, items, extras } = req.body;

  const menu = readMenuByBranch(branchId);
  const index = menu.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Ürün bulunamadı' });
  }

  menu[index] = {
    ...menu[index],
    name: name || menu[index].name,
    price:
      price !== undefined ? parseFloat(price) : menu[index].price,
    category: category || menu[index].category,
    menuCategory:
      menuCategory ||
      menu[index].menuCategory ||
      category ||
      menu[index].category,
    ...(category === 'campaign' && items ? { items } : {}),
    ...(extras !== undefined
      ? { extras: extras.trim() || undefined }
      : {}),
    branchId: branchId, // Zorunlu
  };

  writeMenuByBranch(branchId, menu);

  broadcastToBranch(branchId, { type: 'MENU_UPDATED', menu });
  res.json(menu[index]);
});

app.delete('/api/admin/menu/:id', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const { id } = req.params;
  const menu = readMenuByBranch(branchId);
  const filteredMenu = menu.filter((item) => item.id !== id);

  if (filteredMenu.length === menu.length) {
    return res.status(404).json({ error: 'Ürün bulunamadı' });
  }

  writeMenuByBranch(branchId, filteredMenu);

  broadcastToBranch(branchId, { type: 'MENU_UPDATED', menu: filteredMenu });
  res.json({ success: true });
});

// Orders routes
app.get('/api/orders', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const orders = readOrdersByBranch(branchId);

  // Kitchen ve Bar sadece kendi kategorilerini görür (READY ve SERVED olmayanlar)
  if (user.role === 'kitchen' || user.role === 'bar') {
    const filteredOrders = orders
      .map((order) => ({
        ...order,
        items: order.items.filter(
          (item) =>
            item.category === user.role &&
            item.status !== 'SERVED' &&
            item.status !== 'CANCELLED' &&
            item.status !== 'READY'
        ),
      }))
      .filter((order) => order.items.length > 0);

    return res.json(filteredOrders);
  }

  // Waiter tüm masaları görür ama sadece kendi siparişlerini yönetebilir
  if (user.role === 'waiter') {
    return res.json(orders);
  }

  // Cashier ödenmemiş siparişleri görür
  if (user.role === 'cashier') {
    const unpaidOrders = orders.filter((order) => !order.isPaid);
    return res.json(unpaidOrders);
  }

  // Admin tüm siparişleri görür
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'waiter') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const { items, tableNumber } = req.body;
  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ error: 'Sipariş öğeleri gerekli' });
  }

  const menu = readMenuByBranch(branchId);

  const orderItems: OrderItem[] = [];

  items.forEach((item: any) => {
    const menuItem = menu.find((m) => m.id === item.menuItemId);
    if (!menuItem) {
      throw new Error(`Menu item not found: ${item.menuItemId}`);
    }

    // Kampanya menüsü ise içindeki ürünleri ayrı ayrı ekle
    if (menuItem.category === 'campaign' && (menuItem as any).items) {
      (menuItem as any).items.forEach((campaignItem: any) => {
        const fullMenuItem = menu.find((m) => m.id === campaignItem.id);
        if (fullMenuItem) {
          orderItems.push({
            id: uuidv4(),
            menuItemId: fullMenuItem.id,
            menuItemName: `${menuItem.name} - ${fullMenuItem.name}`,
            quantity: item.quantity,
            price: fullMenuItem.price,
            category: campaignItem.category as 'kitchen' | 'bar',
            status: 'PENDING' as OrderStatus,
            branchId: branchId,
          });
        }
      });
    } else {
      // Normal ürün veya tatlı
      let category: 'kitchen' | 'bar' = 'kitchen';

      const itemCategory = (menuItem as any).category;
      const menuCat = (menuItem as any).menuCategory;

      if (menuCat === 'dessert') {
        category = itemCategory === 'bar' ? 'bar' : 'kitchen';
      } else if (itemCategory === 'bar') {
        category = 'bar';
      } else if (itemCategory === 'kitchen') {
        category = 'kitchen';
      } else {
        category = 'kitchen';
      }

      orderItems.push({
        id: uuidv4(),
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        category,
        status: 'PENDING' as OrderStatus,
        branchId: branchId,
      });
    }
  });

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order: Order = {
    id: uuidv4(),
    waiterId: user.id,
    waiterName: user.username,
    tableNumber: tableNumber || undefined,
    items: orderItems,
    createdAt: new Date().toISOString(),
    totalAmount,
    isPaid: false,
    branchId: branchId,
  };

  const orders = readOrdersByBranch(branchId);
  orders.push(order);
  writeOrdersByBranch(branchId, orders);

  broadcastToBranch(branchId, { type: 'NEW_ORDER', order });

  res.json(order);
});

app.patch('/api/orders/:orderId/items/:itemId', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const { orderId, itemId } = req.params;
  const { status, cancelledReason } = req.body;

  const orders = readOrdersByBranch(branchId);
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const item = order.items.find((i) => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  // Kitchen ve Bar sadece kendi kategorilerini güncelleyebilir
  if (
    (user.role === 'kitchen' || user.role === 'bar') &&
    item.category !== user.role
  ) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Waiter sadece kendi siparişlerini SERVED olarak işaretleyebilir
  if (user.role === 'waiter') {
    if (order.waiterId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (status !== 'SERVED') {
      return res
        .status(403)
        .json({ error: 'Waiter can only mark items as SERVED' });
    }
  }

  item.status = status;
  if (status === 'CANCELLED' && cancelledReason) {
    item.cancelledReason = cancelledReason;
  }

  writeOrdersByBranch(branchId, orders);

  broadcastToBranch(branchId, { type: 'ORDER_UPDATED', order });

  res.json(order);
});

// Masa taşıma
app.patch('/api/orders/:orderId/move-table', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'waiter') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { orderId } = req.params;
  const { newTableNumber } = req.body;

  if (!newTableNumber || newTableNumber < 1) {
    return res
      .status(400)
      .json({ error: 'Geçerli bir masa numarası gerekli' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const orders = readOrdersByBranch(branchId);
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.waiterId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (order.isPaid) {
    return res.status(400).json({ error: 'Ödenmiş sipariş taşınamaz' });
  }

  order.tableNumber = newTableNumber;
  writeOrdersByBranch(branchId, orders);

  broadcastToBranch(branchId, { type: 'ORDER_UPDATED', order });

  res.json(order);
});

// Kasa - Masa ödemesi
app.post('/api/cashier/pay', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'cashier') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const { tableNumber, paymentMethod, discount } = req.body;

  if (!tableNumber || !paymentMethod) {
    return res
      .status(400)
      .json({ error: 'Masa numarası ve ödeme yöntemi gerekli' });
  }

  const orders = readOrdersByBranch(branchId);
  const tableOrders = orders.filter(
    (order) => order.tableNumber === tableNumber && !order.isPaid
  );

  if (tableOrders.length === 0) {
    return res
      .status(404)
      .json({ error: 'Bu masada ödenmemiş sipariş yok' });
  }

  const totalAmount = tableOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const discountAmount = discount || 0;
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const payment = {
    method: paymentMethod,
    amount: totalAmount,
    discount: discountAmount,
    finalAmount,
    paidAt: new Date().toISOString(),
    cashierId: user.id,
    cashierName: user.username,
  };

  tableOrders.forEach((order) => {
    order.payment = payment;
    order.isPaid = true;
  });

  writeOrdersByBranch(branchId, orders);

  broadcastToBranch(branchId, {
    type: 'PAYMENT_COMPLETED',
    tableNumber,
    orders: tableOrders,
  });

  res.json({ success: true, orders: tableOrders, payment });
});

// Kasa - Masa bilgisi
app.get('/api/cashier/table/:tableNumber', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'cashier') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { tableNumber } = req.params;
  const tableNum = parseInt(tableNumber);

  if (!tableNum || tableNum < 1) {
    return res
      .status(400)
      .json({ error: 'Geçerli bir masa numarası gerekli' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const orders = readOrdersByBranch(branchId);
  const tableOrders = orders.filter(
    (order) => order.tableNumber === tableNum && !order.isPaid
  );

  const totalAmount = tableOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const allItems = tableOrders.flatMap((order) => order.items);

  res.json({
    tableNumber: tableNum,
    orders: tableOrders,
    totalAmount,
    itemCount: allItems.length,
    orderCount: tableOrders.length,
  });
});

// Geçmiş siparişler
app.get('/api/orders/completed', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const completedOrders = readCompletedOrdersByBranch(branchId);

  if (user.role === 'kitchen' || user.role === 'bar') {
    const filteredOrders = completedOrders
      .map((order) => ({
        ...order,
        items: order.items.filter(
          (item: OrderItem) => item.category === user.role
        ),
      }))
      .filter((order) => order.items.length > 0);

    return res.json(filteredOrders);
  }

  res.json(completedOrders);
});

// READY olan ürünleri geçmiş siparişlere taşı
app.post('/api/orders/move-to-completed', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || (user.role !== 'kitchen' && user.role !== 'bar')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const orders = readOrdersByBranch(branchId);
  const completedOrders = readCompletedOrdersByBranch(branchId);
  const now = new Date().toISOString();

  let movedCount = 0;

  orders.forEach((order) => {
    const readyItems = order.items.filter(
      (item) => item.category === user.role && item.status === 'READY'
    );

    if (readyItems.length > 0 && !order.isPaid) {
      const orderToMove = {
        ...order,
        items: readyItems,
        completedAt: now,
      };

      completedOrders.push(orderToMove);
      movedCount++;

      order.items = order.items.filter(
        (item) => !(item.category === user.role && item.status === 'READY')
      );
    }
  });

  const remainingOrders = orders.filter((order) => order.items.length > 0);

  writeOrdersByBranch(branchId, remainingOrders);
  writeCompletedOrdersByBranch(branchId, completedOrders);

  if (movedCount > 0) {
    broadcastToBranch(branchId, {
      type: 'ORDERS_MOVED_TO_COMPLETED',
      count: movedCount,
    });
  }

  res.json({ success: true, movedCount });
});

// Gün sonu sıfırlama fonksiyonu
function resetDay() {
  // For branch-based, this should be called per branch, but for now, use current branch context.
  // If you want to reset for all branches, iterate over all branch IDs.
  // Here, we'll just call for 'default' branch for backward compatibility.
  writeCompletedOrdersByBranch('default', []);
  broadcast({ type: 'DAY_RESET' });
  console.log('Gün sonu otomatik sıfırlandı:', new Date().toISOString());
}

// Otomatik gün sonu kontrolü
let lastResetDate = new Date().toDateString();
setInterval(() => {
  const now = new Date();
  const currentDate = now.toDateString();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours === 0 && minutes === 0 && currentDate !== lastResetDate) {
    resetDay();
    lastResetDate = currentDate;
  }
}, 60000);

// Gün sonu sıfırlama (manuel)
app.post('/api/admin/reset-day', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  writeCompletedOrdersByBranch(branchId, []);
  broadcastToBranch(branchId, { type: 'DAY_RESET' });
  res.json({
    success: true,
    message:
      'Gün sonu sıfırlandı (sadece geçmiş siparişler temizlendi)',
  });
});

// Anlık ciro
app.get('/api/reports/live', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const orders = readOrdersByBranch(branchId);
  const completedOrders = readCompletedOrdersByBranch(branchId);
  const allOrders = [...orders, ...completedOrders];

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = allOrders.filter(
    (order) => order.createdAt.startsWith(today) && order.isPaid
  );

  let totalRevenue = 0;
  const waiterSales: Record<string, { name: string; sales: number }> =
    {};

  todayOrders.forEach((order) => {
    if (order.payment) {
      totalRevenue += order.payment.finalAmount;

      if (order.waiterId && order.waiterName) {
        if (!waiterSales[order.waiterId]) {
          waiterSales[order.waiterId] = {
            name: order.waiterName,
            sales: 0,
          };
        }
        waiterSales[order.waiterId].sales +=
          order.payment.finalAmount;
      }
    }
  });

  res.json({
    totalRevenue,
    waiterSales,
    orderCount: todayOrders.length,
  });
});

// Günlük/Haftalık/Aylık rapor
app.get('/api/reports/:period', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { period } = req.params;
  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    return res.status(400).json({
      error: 'Geçersiz periyot (daily, weekly, monthly)',
    });
  }

  const branchId = validateBranchId(getBranchId(req));
  const orders = readOrdersByBranch(branchId);
  const completedOrders = readCompletedOrdersByBranch(branchId);
  const allOrders = [...orders, ...completedOrders];

  const now = new Date();

  // 👉 Opsiyonel tarih aralığı (sadece weekly / monthly için)
  const { start, end } = req.query as { start?: string; end?: string };

  let startDate: Date;
  let endDate: Date;

  if (start && end && (period === 'weekly' || period === 'monthly')) {
    // Kullanıcının seçtiği aralık
    startDate = new Date(start);
    endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Eski varsayılan davranış
    if (period === 'daily') {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
    } else if (period === 'weekly') {
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    endDate = now;
  }

  const filteredOrders = allOrders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return (
      orderDate >= startDate &&
      orderDate <= endDate &&
      order.isPaid &&
      order.payment
    );
  });

  let totalRevenue = 0;
  const waiterSales: Record<string, { name: string; sales: number }> = {};
  const paymentMethods = { cash: 0, card: 0 };

  filteredOrders.forEach((order) => {
    if (order.payment) {
      totalRevenue += order.payment.finalAmount;

      if (order.payment.method === 'cash') {
        paymentMethods.cash += order.payment.finalAmount;
      } else {
        paymentMethods.card += order.payment.finalAmount;
      }

      if (order.waiterId && order.waiterName) {
        if (!waiterSales[order.waiterId]) {
          waiterSales[order.waiterId] = {
            name: order.waiterName,
            sales: 0,
          };
        }
        waiterSales[order.waiterId].sales += order.payment.finalAmount;
      }
    }
  });

  res.json({
    period,
    totalRevenue,
    waiterSales,
    paymentMethods,
    orderCount: filteredOrders.length,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
});

// Belirli tarih aralığındaki verileri temizleme (haftalık/aylık rapor aralığı için)
// NOT: Bugünün siparişlerini silmez ki günlük ve anlık ciro bozulmasın.
app.post('/api/reports/clear-range', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { start, end } = req.body as { start?: string; end?: string };

  if (!start || !end) {
    return res.status(400).json({ error: 'start ve end zorunlu (YYYY-MM-DD)' });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  const todayStr = new Date().toISOString().split('T')[0];

  const branchId = validateBranchId(getBranchId(req));
  let orders = readOrdersByBranch(branchId);
  let completedOrders = readCompletedOrdersByBranch(branchId);

  const isInRangeAndNotToday = (createdAt: string) => {
    const d = new Date(createdAt);
    const dateStr = createdAt.split('T')[0];
    return d >= startDate && d <= endDate && dateStr !== todayStr;
  };

  const beforeOrdersLen = orders.length;
  const beforeCompletedLen = completedOrders.length;

  orders = orders.filter((o) => !isInRangeAndNotToday(o.createdAt));
  completedOrders = completedOrders.filter(
    (o) => !isInRangeAndNotToday(o.createdAt)
  );

  writeOrdersByBranch(branchId, orders);
  writeCompletedOrdersByBranch(branchId, completedOrders);

  res.json({
    success: true,
    removedOrders: beforeOrdersLen - orders.length,
    removedCompletedOrders: beforeCompletedLen - completedOrders.length,
  });
});

// Daily report
app.get('/api/reports/daily', (req, res) => {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const branchId = validateBranchId(getBranchId(req));
  const orders = readOrdersByBranch(branchId);
  const completedOrders = readCompletedOrdersByBranch(branchId);
  const allOrders = [...orders, ...completedOrders];
  const today = new Date().toISOString().split('T')[0];

  const todayOrders = allOrders.filter(
    (order) =>
      order.createdAt.startsWith(today) &&
      order.isPaid &&
      order.payment
  );

  let totalRevenue = 0;
  let cancelledAmount = 0;
  const waiterSales: Record<string, { name: string; sales: number }> =
    {};
  const productCounts: Record<
    string,
    { name: string; quantity: number; revenue: number }
  > = {};
  const paymentMethods = { cash: 0, card: 0 };

  todayOrders.forEach((order) => {
    if (order.payment) {
      if (order.payment.method === 'cash') {
        paymentMethods.cash += order.payment.finalAmount;
      } else {
        paymentMethods.card += order.payment.finalAmount;
      }

      totalRevenue += order.payment.finalAmount;

      if (order.waiterId && order.waiterName) {
        if (!waiterSales[order.waiterId]) {
          waiterSales[order.waiterId] = {
            name: order.waiterName,
            sales: 0,
          };
        }
        waiterSales[order.waiterId].sales +=
          order.payment.finalAmount;
      }

      order.items.forEach((item) => {
        if (item.status !== 'CANCELLED') {
          const itemTotal = item.price * item.quantity;

          if (!productCounts[item.menuItemId]) {
            productCounts[item.menuItemId] = {
              name: item.menuItemName,
              quantity: 0,
              revenue: 0,
            };
          }
          productCounts[item.menuItemId].quantity +=
            item.quantity;
          productCounts[item.menuItemId].revenue += itemTotal;
        } else {
          cancelledAmount += item.price * item.quantity;
        }
      });
    }
  });

  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const report: DailyReport = {
    totalRevenue,
    cancelledAmount,
    waiterSales,
    topProducts,
    paymentMethods,
  };

  res.json(report);
});

// Serve static files in production (AFTER all API routes)
if (NODE_ENV === 'production') {
  app.use(express.static(CLIENT_BUILD_PATH));

  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(CLIENT_BUILD_PATH, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
  if (NODE_ENV === 'production') {
    console.log(`📁 Serving static files from: ${CLIENT_BUILD_PATH}`);
  }
});