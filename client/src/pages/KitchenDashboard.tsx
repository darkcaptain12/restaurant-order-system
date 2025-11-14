import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { getApiUrl } from '../config';

interface OrderItem {
  id: string;
  menuItemName: string;
  quantity: number;
  price: number;
  status: string;
  category?: string;
  cancelledReason?: string;
}

interface Order {
  id: string;
  waiterName: string;
  tableNumber?: number;
  items: OrderItem[];
  createdAt: string;
  completedAt?: string;
}

export default function KitchenDashboard() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

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

  const fetchCompletedOrders = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/orders/completed'), {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        // Sadece mutfak kategorisindeki ürünleri göster
        const kitchenOrders = data
          .map((order: Order) => ({
            ...order,
            items: order.items.filter((item: OrderItem) => item.category === 'kitchen')
          }))
          .filter((order: Order) => order.items.length > 0);
        setCompletedOrders(kitchenOrders);
      }
    } catch (error) {
      console.error('Failed to fetch completed orders:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    if (activeTab === 'completed') {
      fetchCompletedOrders();
    }
  }, [fetchOrders, fetchCompletedOrders, activeTab]);

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATED') {
      fetchOrders();
    }
    if (data.type === 'ORDER_COMPLETED' || data.type === 'DAY_RESET') {
      fetchCompletedOrders();
    }
  }, [fetchOrders, fetchCompletedOrders]);

  useWebSocket(handleWebSocketMessage);

  const updateItemStatus = async (orderId: string, itemId: string, status: string) => {
    try {
      const res = await fetch(
        getApiUrl(`/api/orders/${orderId}/items/${itemId}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status })
        }
      );

      if (res.ok) {
        await fetchOrders();
        // READY olan ürünler otomatik olarak ana ekrandan kaldırılır
        if (status === 'READY') {
          setTimeout(async () => {
            await fetchOrders();
            if (activeTab === 'completed') {
              await fetchCompletedOrders();
            }
          }, 500);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'İşlem başarısız oldu');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Hata oluştu');
    }
  };

  const cancelItem = async (orderId: string, itemId: string, reason: string) => {
    if (!reason || !reason.trim()) {
      alert('İptal nedeni gerekli');
      return;
    }

    try {
      const res = await fetch(
        getApiUrl(`/api/orders/${orderId}/items/${itemId}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'CANCELLED', cancelledReason: reason.trim() })
        }
      );

      if (res.ok) {
        await fetchOrders();
      } else {
        const error = await res.json();
        alert(error.error || 'İptal işlemi başarısız oldu');
      }
    } catch (error) {
      console.error('Failed to cancel item:', error);
      alert('Hata oluştu');
    }
  };

  const handleCancel = (orderId: string, itemId: string) => {
    const reason = window.prompt('İptal nedeni:');
    if (reason && reason.trim()) {
      cancelItem(orderId, itemId, reason);
    }
  };

  const renderOrderList = (orderList: Order[], isCompleted = false) => {
    if (orderList.length === 0) {
      return (
        <div className="bg-white p-12 rounded-xl shadow-md text-center border border-gray-200">
          <div className="text-6xl mb-4">{isCompleted ? '📜' : '🍽️'}</div>
          <p className="text-gray-500 font-medium text-lg">
            {isCompleted ? 'Geçmiş sipariş yok' : 'Aktif sipariş yok'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {orderList.map(order => (
          <div key={order.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-gray-800">
                    👤 Garson: {order.waiterName}
                  </h3>
                  {order.tableNumber && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      🪑 Masa {order.tableNumber}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  🕐 {new Date(order.createdAt).toLocaleString('tr-TR')}
                  {order.completedAt && (
                    <span className="ml-2">• ✅ {new Date(order.completedAt).toLocaleString('tr-TR')}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {order.items.map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 mb-1 text-lg">{item.menuItemName}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      Adet: {item.quantity} × {item.price} ₺ = {item.quantity * item.price} ₺
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${
                        item.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : item.status === 'READY'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      {item.status === 'PENDING' && '⏳ Beklemede'}
                      {item.status === 'IN_PROGRESS' && '👨‍🍳 Hazırlanıyor'}
                      {item.status === 'READY' && '✅ Hazır'}
                      {item.status === 'CANCELLED' && '❌ İptal Edildi'}
                    </span>
                    {item.status === 'CANCELLED' && item.cancelledReason && (
                      <p className="text-sm text-red-600 mt-2 font-medium">
                        💬 Neden: {item.cancelledReason}
                      </p>
                    )}
                  </div>
                  {!isCompleted && (
                    <div className="flex gap-2 ml-4">
                      {item.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updateItemStatus(order.id, item.id, 'IN_PROGRESS')}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            ▶️ Başlat
                          </button>
                          <button
                            onClick={() => handleCancel(order.id, item.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            ❌ İptal
                          </button>
                        </>
                      )}
                      {item.status === 'IN_PROGRESS' && (
                        <button
                          onClick={async () => {
                            await updateItemStatus(order.id, item.id, 'READY');
                            // READY olan ürünleri geçmişe taşı
                            try {
                              await fetch(getApiUrl('/api/orders/move-to-completed'), {
                                method: 'POST',
                                credentials: 'include'
                              });
                              fetchOrders();
                              if (activeTab === 'completed') {
                                fetchCompletedOrders();
                              }
                            } catch (error) {
                              console.error('Failed to move to completed:', error);
                            }
                          }}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          ✅ Hazır
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🍳</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              Mutfak Paneli
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg">
              <span className="text-orange-600 font-medium">👨‍🍳 {user?.username}</span>
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
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-6 py-3 font-semibold rounded-md transition-all duration-200 ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🔥 Aktif Siparişler
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-6 py-3 font-semibold rounded-md transition-all duration-200 ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📜 Geçmiş Siparişler
          </button>
        </div>

        {activeTab === 'active' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Aktif Siparişler</h2>
              <button
                onClick={fetchOrders}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              >
                🔄 Yenile
              </button>
            </div>
            {renderOrderList(orders, false)}
          </>
        )}

        {activeTab === 'completed' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Geçmiş Siparişler</h2>
              <button
                onClick={fetchCompletedOrders}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              >
                🔄 Yenile
              </button>
            </div>
            {renderOrderList(completedOrders, true)}
          </>
        )}
      </div>
    </div>
  );
}
