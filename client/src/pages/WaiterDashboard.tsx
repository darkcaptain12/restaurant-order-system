import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { getApiUrl } from '../config';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  menuCategory?: string;
  items?: any[];
}

interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  status: string;
  cancelledReason?: string;
}

interface Order {
  id: string;
  waiterId: string;
  waiterName: string;
  tableNumber?: number;
  items: OrderItem[];
  createdAt: string;
  totalAmount: number;
  isPaid?: boolean;
}

const TOTAL_TABLES = 20;

export default function WaiterDashboard() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Array<{ menuItemId: string; quantity: number }>>([]);
  const [activeTab, setActiveTab] = useState<'tables' | 'menu' | 'orders'>('tables');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [menuCategory, setMenuCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/orders'), {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/menu'), {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMenu(data);
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchMenu();
  }, [fetchOrders, fetchMenu]);

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATED' || data.type === 'PAYMENT_COMPLETED') {
      fetchOrders();
    }
    if (data.type === 'MENU_UPDATED') {
      fetchMenu();
    }
  }, [fetchOrders, fetchMenu]);

  useWebSocket(handleWebSocketMessage);

  const getTableStatus = (tableNum: number) => {
    // Tüm garsonların ödenmemiş siparişlerini kontrol et
    const unpaidOrders = orders.filter(order => order.tableNumber === tableNum && !order.isPaid);
    if (unpaidOrders.length === 0) return 'empty';
    
    const hasPending = unpaidOrders.some(order => 
      order.items.some(item => item.status === 'PENDING' || item.status === 'IN_PROGRESS')
    );
    const hasReady = unpaidOrders.some(order => 
      order.items.some(item => item.status === 'READY')
    );
    
    if (hasReady) return 'ready';
    if (hasPending) return 'pending';
    return 'served';
  };

  const getTableOrders = (tableNum: number) => {
    // Tüm garsonların siparişlerini göster
    return orders.filter(order => order.tableNumber === tableNum && !order.isPaid);
  };

  const getMyTableOrders = (tableNum: number) => {
    // Sadece bu garsonun siparişlerini göster
    return orders.filter(order => order.tableNumber === tableNum && !order.isPaid && order.waiterId === user?.id);
  };

  const handleTableClick = (tableNum: number) => {
    setSelectedTable(tableNum);
    setTableNumber(tableNum);
    setActiveTab('menu');
    setCart([]);
  };

  const addToCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === itemId);
      if (existing) {
        return prev.map(i =>
          i.menuItemId === itemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItemId: itemId, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(i => i.menuItemId === itemId ? { ...i, quantity } : i));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== itemId));
  };

  const handleCreateOrder = async () => {
    if (!tableNumber || cart.length === 0) {
      alert('Masa seçin ve sepete ürün ekleyin');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: cart,
          tableNumber
        })
      });

      if (res.ok) {
        setCart([]);
        setActiveTab('tables');
        setSelectedTable(null);
        fetchOrders();
        alert('Sipariş başarıyla oluşturuldu!');
      } else {
        const error = await res.json();
        alert(error.error || 'Sipariş oluşturulamadı');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => {
      const menuItem = menu.find(m => m.id === item.menuItemId);
      return sum + (menuItem?.price || 0) * item.quantity;
    }, 0);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'kitchen':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'bar':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'dessert':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'campaign':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'kitchen':
        return '🍳';
      case 'bar':
        return '🍹';
      case 'dessert':
        return '🍰';
      case 'campaign':
        return '🎁';
      default:
        return '📋';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'kitchen':
        return 'Mutfak';
      case 'bar':
        return 'Bar';
      case 'dessert':
        return 'Tatlı';
      case 'campaign':
        return 'Kampanya';
      default:
        return category;
    }
  };

  const categorizedMenu = menu.reduce((acc: any, item: any) => {
    const cat = item.menuCategory || item.category || 'other';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(item);
    return acc;
  }, {});

  const filteredMenu = menuCategory === 'all' 
    ? menu 
    : categorizedMenu[menuCategory] || [];

  const handleMoveTable = async (orderId: string, currentTable: number) => {
    const newTable = prompt(`Masa ${currentTable} → Yeni masa numarası:`, '');
    if (!newTable || !newTable.trim()) return;
    
    const newTableNum = parseInt(newTable.trim());
    if (!newTableNum || newTableNum < 1 || newTableNum > TOTAL_TABLES) {
      alert('Geçerli bir masa numarası girin (1-20)');
      return;
    }

    if (newTableNum === currentTable) {
      alert('Aynı masa seçilemez');
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/move-table`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newTableNumber: newTableNum })
      });

      if (res.ok) {
        await fetchOrders();
        alert(`Masa ${currentTable} → Masa ${newTableNum} başarıyla taşındı!`);
      } else {
        const error = await res.json();
        alert(error.error || 'Masa taşınamadı');
      }
    } catch (error) {
      console.error('Failed to move table:', error);
      alert('Hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🍽️</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Garson Paneli
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <span className="text-blue-600 font-medium">👤 {user?.username}</span>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex gap-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => {
              setActiveTab('tables');
              setSelectedTable(null);
            }}
            className={`flex-1 px-6 py-3 font-semibold rounded-md transition-all duration-200 ${
              activeTab === 'tables'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🪑 Masalar
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 px-6 py-3 font-semibold rounded-md transition-all duration-200 ${
              activeTab === 'menu'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 Menü
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 px-6 py-3 font-semibold rounded-md transition-all duration-200 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📦 Siparişlerim ({getMyTableOrders(selectedTable || 0).length})
          </button>
        </div>

        {activeTab === 'tables' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Masa Düzeni</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map(tableNum => {
                const status = getTableStatus(tableNum);
                const tableOrders = getTableOrders(tableNum);
                const myOrders = getMyTableOrders(tableNum);
                const totalAmount = tableOrders.reduce((sum, order) => sum + order.totalAmount, 0);
                const myTotalAmount = myOrders.reduce((sum, order) => sum + order.totalAmount, 0);
                
                return (
                  <div key={tableNum} className="relative group">
                    <button
                      onClick={() => handleTableClick(tableNum)}
                      className={`w-full p-6 rounded-xl shadow-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                        status === 'empty'
                          ? 'bg-white border-gray-300 hover:border-blue-400'
                          : status === 'pending'
                          ? 'bg-yellow-50 border-yellow-400 hover:border-yellow-500'
                          : status === 'ready'
                          ? 'bg-green-50 border-green-400 hover:border-green-500 animate-pulse'
                          : 'bg-blue-50 border-blue-400 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">
                          {status === 'empty' ? '🪑' : status === 'ready' ? '✅' : status === 'pending' ? '⏳' : '🍽️'}
                        </div>
                        <div className="font-bold text-lg text-gray-800 mb-1">
                          Masa {tableNum}
                        </div>
                        {status !== 'empty' && (
                          <>
                            <div className="text-xs text-gray-600 mb-1">
                              {tableOrders.length} sipariş
                              {myOrders.length > 0 && (
                                <span className="ml-1 text-blue-600 font-semibold">
                                  ({myOrders.length} benim)
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              {totalAmount.toFixed(0)} ₺
                            </div>
                            {myTotalAmount > 0 && (
                              <div className="text-xs font-semibold text-blue-600 mt-1">
                                Benim: {myTotalAmount.toFixed(0)} ₺
                              </div>
                            )}
                            {status === 'served' && (
                              <div className="mt-1 text-xs font-semibold text-blue-600">
                                Servis edildi
                              </div>
                            )}
                          </>
                        )}
                        {status === 'ready' && (
                          <div className="mt-2 text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                            HAZIR!
                          </div>
                        )}
                      </div>
                    </button>
                    {status !== 'empty' && myOrders.length > 0 && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (myOrders.length === 1) {
                              handleMoveTable(myOrders[0].id, tableNum);
                            } else {
                              const orderId = prompt(`Taşınacak sipariş ID'si (${myOrders.map(o => o.id.substring(0, 8)).join(', ')}):`);
                              if (orderId) {
                                const order = myOrders.find(o => o.id.includes(orderId));
                                if (order) {
                                  handleMoveTable(order.id, tableNum);
                                }
                              }
                            }
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg transition-all opacity-90 hover:opacity-100"
                          title="Masa Taşı"
                        >
                          🔄 Taşı
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedTable && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <p className="text-center font-semibold text-blue-800">
                  🪑 Masa {selectedTable} seçildi - Menü sekmesine geçin
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Menü</h2>
                {selectedTable && (
                  <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
                    🪑 Masa {selectedTable}
                  </div>
                )}
              </div>
              
              {/* Kategori Tab Menüsü */}
              <div className="mb-6 bg-white p-2 rounded-lg shadow-md border border-gray-200 flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setMenuCategory('all')}
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    menuCategory === 'all'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📋 Tümü
                </button>
                {Object.keys(categorizedMenu).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setMenuCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                      menuCategory === cat
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getCategoryIcon(cat)} {getCategoryName(cat)}
                  </button>
                ))}
              </div>

              {/* Menü İçeriği */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenu.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 transform hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{item.name}</h3>
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold border ${getCategoryColor(item.category || item.menuCategory || 'other')}`}>
                          {getCategoryIcon(item.category || item.menuCategory || 'other')} {getCategoryName(item.category || item.menuCategory || 'other')}
                        </span>
                        {item.category === 'campaign' && item.items && (
                          <div className="mt-2 text-xs text-gray-600">
                            <p className="font-semibold mb-1">İçerik:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {item.items.map((campaignItem: any, idx: number) => (
                                <li key={idx}>{campaignItem.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        {item.price} ₺
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(item.id)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      ➕ Sepete Ekle
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-lg sticky top-4 border border-gray-200">
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  🛒 Sepet
                  {cart.length > 0 && (
                    <span className="bg-blue-500 text-white text-sm px-2 py-1 rounded-full">
                      {cart.length}
                    </span>
                  )}
                </h2>
                {!selectedTable && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ Önce bir masa seçin
                    </p>
                  </div>
                )}
                {selectedTable && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-semibold">
                      🪑 Masa {selectedTable}
                    </p>
                  </div>
                )}
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-gray-500 font-medium">Sepet boş</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {cart.map(item => {
                        const menuItem = menu.find(m => m.id === item.menuItemId);
                        if (!menuItem) return null;
                        return (
                          <div
                            key={item.menuItemId}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{menuItem.name}</p>
                              <p className="text-sm text-gray-600">
                                {menuItem.price} ₺ × {item.quantity} = {menuItem.price * item.quantity} ₺
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <button
                                onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md font-bold transition-colors"
                              >
                                −
                              </button>
                              <span className="font-bold text-gray-800 min-w-[2rem] text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md font-bold transition-colors"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(item.menuItemId)}
                                className="text-red-500 hover:text-red-700 ml-2 text-xl font-bold transition-colors"
                                title="Kaldır"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t-2 border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-gray-700">Toplam:</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                          {getTotal()} ₺
                        </span>
                      </div>
                      <button
                        onClick={handleCreateOrder}
                        disabled={loading || !selectedTable || cart.length === 0}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                      >
                        {loading ? '⏳ Gönderiliyor...' : '✅ Siparişi Gönder'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Siparişlerim</h2>
            {selectedTable ? (
              <div className="mb-4">
                <p className="text-gray-600 mb-2">Masa {selectedTable} için siparişler:</p>
                {getMyTableOrders(selectedTable).length === 0 ? (
                  <div className="bg-white p-8 rounded-xl shadow-md text-center border border-gray-200">
                    <div className="text-5xl mb-3">📦</div>
                    <p className="text-gray-500 font-medium">Bu masada siparişiniz yok</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getMyTableOrders(selectedTable).map(order => (
                      <div key={order.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                          <div>
                            <p className="text-xl font-bold text-gray-800">
                              Toplam: <span className="text-green-600">{order.totalAmount} ₺</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end mb-2">
                          {!order.isPaid && (
                            <button
                              onClick={() => handleMoveTable(order.id, order.tableNumber!)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                              title="Masayı Taşı"
                            >
                              🔄 Masa Taşı
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {order.items.map(item => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 mb-1">{item.menuItemName}</p>
                                <p className="text-sm text-gray-500 mb-2">
                                  Adet: {item.quantity} × {item.price} ₺
                                </p>
                                <span
                                  className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${
                                    item.status === 'READY'
                                      ? 'bg-green-100 text-green-800 border border-green-300'
                                      : item.status === 'SERVED'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                      : item.status === 'CANCELLED'
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                  }`}
                                >
                                  {item.status === 'READY' && '✅ Hazır'}
                                  {item.status === 'SERVED' && '🍽️ Servis Edildi'}
                                  {item.status === 'CANCELLED' && '❌ İptal'}
                                  {item.status === 'PENDING' && '⏳ Beklemede'}
                                  {item.status === 'IN_PROGRESS' && '👨‍🍳 Hazırlanıyor'}
                                </span>
                                {item.status === 'READY' && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(
                                          getApiUrl(`/api/orders/${order.id}/items/${item.id}`),
                                          {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            credentials: 'include',
                                            body: JSON.stringify({ status: 'SERVED' })
                                          }
                                        );
                                        if (res.ok) {
                                          fetchOrders();
                                        }
                                      } catch (error) {
                                        console.error('Failed to mark as served:', error);
                                      }
                                    }}
                                    className="ml-3 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                                  >
                                    Servis Et
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl shadow-md text-center border border-gray-200">
                <div className="text-5xl mb-3">🪑</div>
                <p className="text-gray-500 font-medium">Önce bir masa seçin</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
