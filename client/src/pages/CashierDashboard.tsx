import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { getApiUrl } from '../config';

interface Order {
  id: string;
  waiterName: string;
  tableNumber?: number;
  items: any[];
  totalAmount: number;
  createdAt: string;
}

interface TableInfo {
  tableNumber: number;
  orders: Order[];
  totalAmount: number;
  itemCount: number;
  orderCount: number;
}

const TOTAL_TABLES = 20;

export default function CashierDashboard() {
  const { user, logout } = useAuth();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [discount, setDiscount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATED' || data.type === 'PAYMENT_COMPLETED') {
      fetchOrders();
      if (data.type === 'PAYMENT_COMPLETED' && selectedTable === data.tableNumber) {
        setSelectedTable(null);
        setTableInfo(null);
        alert('Ödeme tamamlandı!');
      }
    }
  }, [fetchOrders, selectedTable]);

  useWebSocket(handleWebSocketMessage);

  const getTableStatus = (tableNum: number) => {
    const tableOrders = orders.filter(order => order.tableNumber === tableNum && !order.isPaid);
    if (tableOrders.length === 0) return 'empty';
    const totalAmount = tableOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    return totalAmount > 0 ? 'unpaid' : 'empty';
  };

  const handleTableClick = async (tableNum: number) => {
    setSelectedTable(tableNum);
    setDiscount('');
    setPaymentMethod('cash');
    
    try {
      const res = await fetch(getApiUrl(`/api/cashier/table/${tableNum}`), {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTableInfo(data);
      } else {
        alert('Masa bilgisi alınamadı');
      }
    } catch (error) {
      console.error('Failed to fetch table info:', error);
      alert('Hata oluştu');
    }
  };

  const handlePayment = async () => {
    if (!selectedTable || !tableInfo) return;

    const discountAmount = parseFloat(discount) || 0;
    if (discountAmount < 0) {
      alert('İndirim negatif olamaz');
      return;
    }

    if (discountAmount > tableInfo.totalAmount) {
      alert('İndirim toplam tutardan fazla olamaz');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/cashier/pay'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tableNumber: selectedTable,
          paymentMethod,
          discount: discountAmount
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Ödeme tamamlandı!\nToplam: ${data.payment.amount.toFixed(2)} ₺\nİndirim: ${data.payment.discount.toFixed(2)} ₺\nÖdenen: ${data.payment.finalAmount.toFixed(2)} ₺\nYöntem: ${paymentMethod === 'cash' ? 'Nakit' : 'Kart'}`);
        setSelectedTable(null);
        setTableInfo(null);
        setDiscount('');
        setPaymentMethod('cash');
        await fetchOrders();
      } else {
        const error = await res.json();
        alert(error.error || 'Ödeme yapılamadı');
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const finalAmount = tableInfo 
    ? Math.max(0, tableInfo.totalAmount - (parseFloat(discount) || 0))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-800 bg-clip-text text-transparent">
              Kasa Paneli
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
              <span className="text-green-600 font-medium">💵 {user?.username}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Masa Düzeni</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map(tableNum => {
                const status = getTableStatus(tableNum);
                const tableOrders = orders.filter(order => order.tableNumber === tableNum && !order.isPaid);
                const totalAmount = tableOrders.reduce((sum, order) => sum + order.totalAmount, 0);
                
                return (
                  <button
                    key={tableNum}
                    onClick={() => handleTableClick(tableNum)}
                    className={`p-6 rounded-xl shadow-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                      selectedTable === tableNum
                        ? 'bg-blue-100 border-blue-500 ring-4 ring-blue-300'
                        : status === 'empty'
                        ? 'bg-white border-gray-300 hover:border-gray-400'
                        : 'bg-yellow-50 border-yellow-400 hover:border-yellow-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">
                        {status === 'empty' ? '🪑' : '💰'}
                      </div>
                      <div className="font-bold text-lg text-gray-800 mb-1">
                        Masa {tableNum}
                      </div>
                      {status === 'unpaid' && (
                        <>
                          <div className="text-xs text-gray-600 mb-1">
                            {tableOrders.length} sipariş
                          </div>
                          <div className="text-sm font-semibold text-yellow-600">
                            {totalAmount.toFixed(0)} ₺
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedTable && tableInfo ? (
              <div className="bg-white p-6 rounded-xl shadow-lg sticky top-4 border border-gray-200">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  💰 Masa {selectedTable} Hesabı
                </h2>
                
                <div className="space-y-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Sipariş Sayısı</p>
                    <p className="text-lg font-bold text-gray-800">{tableInfo.orderCount}</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Tutar</p>
                    <p className="text-2xl font-bold text-green-600">{tableInfo.totalAmount.toFixed(2)} ₺</p>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tableInfo.orders.map(order => (
                      <div key={order.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Garson: {order.waiterName}</span>
                          <span className="text-sm font-bold text-blue-600">{order.totalAmount.toFixed(2)} ₺</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(order.createdAt).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ödeme Yöntemi
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          paymentMethod === 'cash'
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        💵 Nakit
                      </button>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          paymentMethod === 'card'
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        💳 Kart
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İndirim (₺)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Ara Toplam:</span>
                      <span className="text-lg font-bold text-gray-800">{tableInfo.totalAmount.toFixed(2)} ₺</span>
                    </div>
                    {parseFloat(discount) > 0 && (
                      <div className="flex justify-between items-center mb-2 text-red-600">
                        <span className="text-sm font-medium">İndirim:</span>
                        <span className="text-lg font-bold">-{parseFloat(discount).toFixed(2)} ₺</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-green-300">
                      <span className="text-lg font-bold text-gray-800">Ödenecek:</span>
                      <span className="text-2xl font-bold text-green-600">{finalAmount.toFixed(2)} ₺</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={loading || finalAmount <= 0}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ İşleniyor...' : `✅ ${paymentMethod === 'cash' ? 'Nakit' : 'Kart'} ile Öde`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-lg sticky top-4 border border-gray-200">
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">💰</div>
                  <p className="text-gray-500 font-medium">Masa seçin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

