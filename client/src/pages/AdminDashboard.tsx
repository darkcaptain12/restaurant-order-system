import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config';

interface DailyReport {
  totalRevenue: number;
  cancelledAmount: number;
  waiterSales: Record<string, { name: string; sales: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  paymentMethods: {
    cash: number;
    card: number;
  };
}

interface PeriodReport {
  period: string;
  totalRevenue: number;
  waiterSales: Record<string, { name: string; sales: number }>;
  paymentMethods: {
    cash: number;
    card: number;
  };
  orderCount: number;
  startDate: string;
  endDate: string;
}

interface LiveReport {
  totalRevenue: number;
  waiterSales: Record<string, { name: string; sales: number }>;
  orderCount: number;
}

interface Staff {
  id: string;
  username: string;
  role: 'waiter' | 'cashier';
  pin: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  menuCategory?: string;
  items?: Array<{ id: string; name: string; category: string }>;
  extras?: string;
}

export default function AdminDashboard() {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [periodReport, setPeriodReport] = useState<PeriodReport | null>(null);
  const [liveReport, setLiveReport] = useState<LiveReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'daily' | 'weekly' | 'monthly' | 'staff' | 'menu'>('live');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'waiter' | 'cashier'>('waiter');
  const [addingStaff, setAddingStaff] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    price: '',
    category: 'kitchen',
    menuCategory: 'food',
    extras: ''
  });
  const [campaignItems, setCampaignItems] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [newCampaignItem, setNewCampaignItem] = useState({ name: '', category: 'kitchen' });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [addingMenuItem, setAddingMenuItem] = useState(false);
  // Haftalık ve aylık tarih aralıkları için state
  const [weeklyStart, setWeeklyStart] = useState('');
  const [weeklyEnd, setWeeklyEnd] = useState('');
  const [monthlyStart, setMonthlyStart] = useState('');
  const [monthlyEnd, setMonthlyEnd] = useState('');
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string>('');
  const [showBranchSwitchModal, setShowBranchSwitchModal] = useState(false);
  const [branchSwitchPin, setBranchSwitchPin] = useState('');
  const [branchSwitchTarget, setBranchSwitchTarget] = useState('');

  useEffect(() => {
    // Şubeleri yükle
    fetch(getApiUrl('/api/branches'))
      .then(res => res.json())
      .then(data => {
        setBranches(data);
      })
      .catch(err => console.error('Failed to fetch branches:', err));

    // Mevcut şube ID'sini localStorage'dan al
    const savedBranchId = localStorage.getItem('selectedBranch') || '';
    setCurrentBranchId(savedBranchId);
  }, []);

  useEffect(() => {
    if (activeTab === 'live') {
      fetchLiveReport();
      const interval = setInterval(fetchLiveReport, 5000); // Her 5 saniyede bir güncelle
      return () => clearInterval(interval);
    } else if (activeTab === 'daily') {
      fetchDailyReport();
    } else if (activeTab === 'weekly') {
      fetchPeriodReport('weekly');
    } else if (activeTab === 'monthly') {
      fetchPeriodReport('monthly');
    } else if (activeTab === 'staff') {
      fetchStaff();
    } else if (activeTab === 'menu') {
      fetchMenu();
    }
  }, [activeTab]);

  const fetchMenu = async () => {
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
  };

  const fetchLiveReport = async () => {
    try {
      const res = await fetch(getApiUrl('/api/reports/live'), {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setLiveReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch live report:', error);
    }
  };

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/reports/daily'), {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setDailyReport(data);
      } else {
        alert('Rapor yüklenemedi');
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
      alert('Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodReport = async (period: 'weekly' | 'monthly') => {
    setLoading(true);
    try {
      let url = getApiUrl(`/api/reports/${period}`);

      if (period === 'weekly' && weeklyStart && weeklyEnd) {
        url += `?start=${weeklyStart}&end=${weeklyEnd}`;
      } else if (period === 'monthly' && monthlyStart && monthlyEnd) {
        url += `?start=${monthlyStart}&end=${monthlyEnd}`;
      }

      const res = await fetch(url, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setPeriodReport(data);
      } else {
        alert('Rapor yüklenemedi');
      }
    } catch (error) {
      console.error('Failed to fetch period report:', error);
      alert('Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const clearWeeklyRange = async () => {
    if (!weeklyStart || !weeklyEnd) {
      alert('Önce haftalık tarih aralığını seçmelisiniz.');
      return;
    }

    if (!window.confirm(`${weeklyStart} - ${weeklyEnd} arasındaki verileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/reports/clear-range'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ start: weeklyStart, end: weeklyEnd })
      });

      if (!res.ok) {
        alert('Seçili aralık silinemedi');
        return;
      }

      await fetchPeriodReport('weekly');
    } catch (error) {
      console.error('Failed to clear weekly range:', error);
      alert('Haftalık aralık silinirken hata oluştu');
    }
  };

  const clearMonthlyRange = async () => {
    if (!monthlyStart || !monthlyEnd) {
      alert('Önce aylık tarih aralığını seçmelisiniz.');
      return;
    }

    if (!window.confirm(`${monthlyStart} - ${monthlyEnd} arasındaki verileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/reports/clear-range'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ start: monthlyStart, end: monthlyEnd })
      });

      if (!res.ok) {
        alert('Seçili aralık silinemedi');
        return;
      }

      await fetchPeriodReport('monthly');
    } catch (error) {
      console.error('Failed to clear monthly range:', error);
      alert('Aylık aralık silinirken hata oluştu');
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(getApiUrl('/api/admin/users'), {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPin.trim()) {
      alert('Kullanıcı adı ve PIN gerekli');
      return;
    }

    setAddingStaff(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: newStaffName, pin: newStaffPin, role: newStaffRole })
      });

      if (res.ok) {
        setNewStaffName('');
        setNewStaffPin('');
        setNewStaffRole('waiter');
        fetchStaff();
        alert(`${newStaffRole === 'waiter' ? 'Garson' : 'Kasiyer'} başarıyla eklendi!`);
      } else {
        const error = await res.json();
        alert(error.error || 'Kullanıcı eklenemedi');
      }
    } catch (error) {
      console.error('Failed to add staff:', error);
      alert('Hata oluştu');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId: string, role: 'waiter' | 'cashier') => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${staffId}?role=${role}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        await fetchStaff();
        alert('Kullanıcı başarıyla silindi!');
      } else {
        const error = await res.json();
        alert(error.error || 'Kullanıcı silinemedi');
      }
    } catch (error) {
      console.error('Failed to delete staff:', error);
      alert('Hata oluştu');
    }
  };

  const handleResetDay = async () => {
    if (!confirm('Gün sonu sıfırlaması yapılacak. Geçmiş siparişler silinecek. Emin misiniz?')) {
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/admin/reset-day'), {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        alert('Gün sonu sıfırlandı!');
        if (activeTab === 'live') {
          fetchLiveReport();
        } else if (activeTab === 'daily') {
          fetchDailyReport();
        }
      } else {
        alert('Gün sonu sıfırlanamadı');
      }
    } catch (error) {
      console.error('Failed to reset day:', error);
      alert('Hata oluştu');
    }
  };

  const handleSwitchRole = async (role: string) => {
    try {
      const res = await fetch(getApiUrl('/api/admin/switch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role })
      });

      if (res.ok) {
        const routes: Record<string, string> = {
          kitchen: '/kitchen',
          bar: '/bar',
          cashier: '/cashier',
          admin: '/admin'
        };
        window.location.href = routes[role] || '/admin';
      } else {
        alert('Geçiş yapılamadı');
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
      alert('Hata oluştu');
    }
  };

  const handleBranchSwitch = async () => {
    if (!branchSwitchPin || !branchSwitchTarget) {
      alert('PIN gerekli');
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/admin/switch-branch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ branchId: branchSwitchTarget, pin: branchSwitchPin })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('selectedBranch', branchSwitchTarget);
        setCurrentBranchId(branchSwitchTarget);
        setShowBranchSwitchModal(false);
        setBranchSwitchPin('');
        setBranchSwitchTarget('');
        // Sayfayı yenile
        window.location.reload();
      } else {
        const error = await res.json();
        alert(error.error || 'Şube değiştirilemedi');
      }
    } catch (error) {
      console.error('Failed to switch branch:', error);
      alert('Hata oluştu');
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuItem.name.trim() || !newMenuItem.price) {
      alert('Ürün adı ve fiyat gerekli');
      return;
    }

    setAddingMenuItem(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/menu'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newMenuItem)
      });

      if (res.ok) {
        setNewMenuItem({ name: '', price: '', category: 'kitchen', menuCategory: 'food', extras: '' });
        setCampaignItems([]);
        setNewCampaignItem({ name: '', category: 'kitchen' });
        fetchMenu();
        alert('Ürün başarıyla eklendi!');
      } else {
        const error = await res.json();
        alert(error.error || 'Ürün eklenemedi');
      }
    } catch (error) {
      console.error('Failed to add menu item:', error);
      alert('Hata oluştu');
    } finally {
      setAddingMenuItem(false);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/admin/menu/${id}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        fetchMenu();
        alert('Ürün silindi!');
      } else {
        alert('Ürün silinemedi');
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      alert('Hata oluştu');
    }
  };

  const handleEditMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setAddingMenuItem(true);
    try {
      const payload: any = {
        name: newMenuItem.name.trim() || editingItem.name,
        price: newMenuItem.price || editingItem.price.toString(),
        category: newMenuItem.category || editingItem.category,
        menuCategory: newMenuItem.menuCategory || editingItem.menuCategory || editingItem.category,
        ...(newMenuItem.extras !== undefined ? { extras: newMenuItem.extras } : {}),
        ...(newMenuItem.category === 'campaign' && campaignItems.length > 0 ? { items: campaignItems } : 
            editingItem.category === 'campaign' && editingItem.items ? { items: editingItem.items } : {})
      };

      const res = await fetch(getApiUrl(`/api/admin/menu/${editingItem.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchMenu();
        setEditingItem(null);
        setNewMenuItem({ name: '', price: '', category: 'kitchen', menuCategory: 'food', extras: '' });
        setCampaignItems([]);
        setNewCampaignItem({ name: '', category: 'kitchen' });
        alert('Ürün başarıyla güncellendi!');
      } else {
        const error = await res.json();
        alert(error.error || 'Ürün güncellenemedi');
      }
    } catch (error) {
      console.error('Failed to update menu item:', error);
      alert('Hata oluştu');
    } finally {
      setAddingMenuItem(false);
    }
  };

  const renderReport = (report: DailyReport | PeriodReport | LiveReport | null, isLive = false) => {
    if (!report) return null;

    const waiterSales = 'waiterSales' in report ? report.waiterSales : {};
    const totalRevenue = 'totalRevenue' in report ? report.totalRevenue : 0;
    const paymentMethods = 'paymentMethods' in report ? report.paymentMethods : null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border-2 border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">💰</div>
              <h3 className="text-xl font-bold text-gray-800">Toplam Ciro</h3>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              {totalRevenue.toFixed(2)} ₺
            </p>
          </div>
          {paymentMethods && (
            <>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">💵</div>
                  <h3 className="text-xl font-bold text-gray-800">Nakit</h3>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent">
                  {paymentMethods.cash.toFixed(2)} ₺
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">💳</div>
                  <h3 className="text-xl font-bold text-gray-800">Kart</h3>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  {paymentMethods.card.toFixed(2)} ₺
                </p>
              </div>
            </>
          )}
          {isLive && 'orderCount' in report && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">📦</div>
                <h3 className="text-xl font-bold text-gray-800">Sipariş</h3>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {report.orderCount}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">👥</div>
            <h3 className="text-xl font-bold text-gray-800">Garson Başına Satış</h3>
          </div>
          {Object.keys(waiterSales).length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-gray-500 font-medium">Satış yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(waiterSales)
                .sort(([, a], [, b]) => b.sales - a.sales)
                .map(([waiterId, data], index) => (
                  <div
                    key={waiterId}
                    className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <span className="font-bold text-gray-800 text-lg">{data.name}</span>
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {data.sales.toFixed(2)} ₺
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {'topProducts' in report && report.topProducts && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🏆</div>
              <h3 className="text-xl font-bold text-gray-800">En Çok Satan Ürünler</h3>
            </div>
            {report.topProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-gray-500 font-medium">Satış yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {report.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-bold text-gray-800 text-lg">{product.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({product.quantity} adet)
                        </span>
                      </div>
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {product.revenue.toFixed(2)} ₺
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100">
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">📊</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              Admin Paneli
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={currentBranchId}
              onChange={(e) => {
                const targetBranchId = e.target.value;
                if (targetBranchId && targetBranchId !== currentBranchId) {
                  setBranchSwitchTarget(targetBranchId);
                  setShowBranchSwitchModal(true);
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white shadow-sm"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => handleSwitchRole('kitchen')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                title="Mutfak Paneline Geç"
              >
                🍳 Mutfak
              </button>
              <button
                onClick={() => handleSwitchRole('bar')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                title="Bar Paneline Geç"
              >
                🍹 Bar
              </button>
              <button
                onClick={() => handleSwitchRole('cashier')}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                title="Kasa Paneline Geç"
              >
                💰 Kasa
              </button>
            </div>
            <button
              onClick={handleResetDay}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              title="Gün Sonu Sıfırla"
            >
              🔄 Gün Sonu
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg">
              <span className="text-indigo-600 font-medium">👤 {user?.username}</span>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex gap-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-6 py-3 font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⚡ Anlık
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-3 font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📅 Günlük
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-6 py-3 font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${
              activeTab === 'weekly'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📆 Haftalık
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-3 font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📊 Aylık
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-6 py-3 font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${
              activeTab === 'staff'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            👥 Personel
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-3 font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${
              activeTab === 'menu'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 Menü
          </button>
        </div>

        {activeTab === 'live' && (
          <>
            {loading ? (
              <div className="bg-white p-12 rounded-xl shadow-md text-center border border-gray-200">
                <div className="text-6xl mb-4 animate-bounce">⏳</div>
                <p className="text-gray-500 font-medium text-lg">Yükleniyor...</p>
              </div>
            ) : liveReport ? (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">Canlı Güncelleme (5 saniyede bir)</span>
                </div>
                {renderReport(liveReport, true)}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-md text-center border border-gray-200">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-gray-500 font-medium text-lg">Rapor yüklenemedi</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'daily' && (
          <>
            {loading ? (
              <div className="bg-white p-12 rounded-xl shadow-md text-center border border-gray-200">
                <div className="text-6xl mb-4 animate-bounce">⏳</div>
                <p className="text-gray-500 font-medium text-lg">Yükleniyor...</p>
              </div>
            ) : dailyReport ? (
              renderReport(dailyReport)
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-md text-center border border-gray-200">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-gray-500 font-medium text-lg">Rapor yüklenemedi</p>
                <button
                  onClick={fetchDailyReport}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Tekrar Dene
                </button>
              </div>
            )}
          </>
        )}

        {(activeTab === 'weekly' || activeTab === 'monthly') && (
          <>
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 mb-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={activeTab === 'weekly' ? weeklyStart : monthlyStart}
                    onChange={(e) =>
                      activeTab === 'weekly'
                        ? setWeeklyStart(e.target.value)
                        : setMonthlyStart(e.target.value)
                    }
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={activeTab === 'weekly' ? weeklyEnd : monthlyEnd}
                    onChange={(e) =>
                      activeTab === 'weekly'
                        ? setWeeklyEnd(e.target.value)
                        : setMonthlyEnd(e.target.value)
                    }
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <button
                  onClick={() => fetchPeriodReport(activeTab as 'weekly' | 'monthly')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                >
                  Raporu Göster
                </button>
                <button
                  onClick={activeTab === 'weekly' ? clearWeeklyRange : clearMonthlyRange}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                >
                  Seçili Aralığı Sıfırla
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Not: Günlük ve anlık ciro bu işlemden etkilenmez, sadece seçili tarih aralığındaki geçmiş kayıtlar temizlenir.
              </p>
            </div>

            {loading ? (
              <div className="bg-white p-12 rounded-xl shadow-md text-center border border-gray-200">
                <div className="text-6xl mb-4 animate-bounce">⏳</div>
                <p className="text-gray-500 font-medium text-lg">Yükleniyor...</p>
              </div>
            ) : periodReport ? (
              <div>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    📅 {new Date(periodReport.startDate).toLocaleDateString('tr-TR')} -{' '}
                    {new Date(periodReport.endDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                {renderReport(periodReport)}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-md text-center border border-gray-200">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-gray-500 font-medium text-lg">Rapor yüklenemedi</p>
                <button
                  onClick={() => fetchPeriodReport(activeTab as 'weekly' | 'monthly')}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Tekrar Dene
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                ➕ Yeni Personel Ekle
              </h3>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="Örn: ali"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIN
                    </label>
                    <input
                      type="text"
                      value={newStaffPin}
                      onChange={(e) => setNewStaffPin(e.target.value)}
                      placeholder="Örn: 9999"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rol
                    </label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as 'waiter' | 'cashier')}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="waiter">👤 Garson</option>
                      <option value="cashier">💰 Kasiyer</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addingStaff}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  {addingStaff ? '⏳ Ekleniyor...' : '✅ Personel Ekle'}
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                👥 Mevcut Personel ({staff.length})
              </h3>
              {staff.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">👤</div>
                  <p className="text-gray-500 font-medium">Henüz personel yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staff.map((person) => (
                    <div
                      key={person.id}
                      className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {person.role === 'waiter' ? '👤' : '💰'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-lg">{person.username}</p>
                          <p className="text-sm text-gray-600">
                            {person.role === 'waiter' ? 'Garson' : 'Kasiyer'} • PIN: {person.pin}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteStaff(person.id, person.role)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                {editingItem ? '✏️ Ürün Düzenle' : '➕ Yeni Ürün Ekle'}
              </h3>
              <form onSubmit={editingItem ? handleEditMenuItem : handleAddMenuItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün Adı
                    </label>
                    <input
                      type="text"
                      value={newMenuItem.name}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                      placeholder="Örn: Pizza"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fiyat (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newMenuItem.price}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                      placeholder="Örn: 150"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori (Mutfak/Bar)
                    </label>
                    <select
                      value={newMenuItem.category}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setNewMenuItem({
                          ...newMenuItem,
                          category: cat,
                          menuCategory: cat === 'kitchen' ? 'food' : cat === 'bar' ? 'drink' : cat === 'dessert' ? 'dessert' : 'campaign',
                          extras: cat === 'campaign' ? '' : newMenuItem.extras // Kampanya seçilirse extras'ı temizle
                        });
                        // Kategori değiştiğinde kampanya içeriklerini temizle
                        if (cat !== 'campaign') {
                          setCampaignItems([]);
                        }
                      }}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="kitchen">🍳 Mutfak</option>
                      <option value="bar">🍹 Bar</option>
                      <option value="dessert">🍰 Tatlı</option>
                      <option value="campaign">🎁 Kampanya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Menü Kategorisi
                    </label>
                    <select
                      value={newMenuItem.menuCategory}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, menuCategory: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="food">🍽️ Yemek</option>
                      <option value="drink">🥤 İçecek</option>
                      <option value="dessert">🍰 Tatlı</option>
                      <option value="campaign">🎁 Kampanya</option>
                    </select>
                  </div>
                </div>

                {/* Extras - Opsiyonel (Normal ürünler için) */}
                {newMenuItem.category !== 'campaign' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Extras / Özellikler (Opsiyonel)
                    </label>
                    <textarea
                      value={newMenuItem.extras}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, extras: e.target.value })}
                      placeholder="Örn: Glutensiz, Vejetaryen, Acılı seçenekler..."
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ürünün özel özelliklerini, seçeneklerini veya notlarını buraya yazabilirsiniz</p>
                  </div>
                )}

                {/* Kampanya Menü İçerik Ekleme */}
                {newMenuItem.category === 'campaign' && (
                  <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      🎁 Kampanya Menü İçeriği
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <select
                            value={newCampaignItem.name}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              if (selectedName) {
                                const menuItem = menu.find(m => m.name === selectedName);
                                setNewCampaignItem({
                                  name: selectedName,
                                  category: menuItem ? (menuItem.category === 'kitchen' ? 'kitchen' : 'bar') : 'kitchen'
                                });
                              }
                            }}
                            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          >
                            <option value="">Menüden seç veya yeni ürün adı yaz</option>
                            {menu.filter(m => m.category !== 'campaign').map(item => (
                              <option key={item.id} value={item.name}>
                                {item.name} ({item.category === 'kitchen' ? '🍳 Mutfak' : '🍹 Bar'}) - {item.price} ₺
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={newCampaignItem.name}
                            onChange={(e) => setNewCampaignItem({ ...newCampaignItem, name: e.target.value })}
                            placeholder="Veya yeni ürün adı yaz"
                            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                          <select
                            value={newCampaignItem.category}
                            onChange={(e) => setNewCampaignItem({ ...newCampaignItem, category: e.target.value })}
                            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          >
                            <option value="kitchen">🍳 Mutfak</option>
                            <option value="bar">🍹 Bar</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (newCampaignItem.name.trim()) {
                                // Menüden ürün ID'sini bul
                                const menuItem = menu.find(m => m.name.toLowerCase() === newCampaignItem.name.toLowerCase());
                                if (menuItem) {
                                  setCampaignItems([...campaignItems, {
                                    id: menuItem.id,
                                    name: menuItem.name,
                                    category: newCampaignItem.category
                                  }]);
                                  setNewCampaignItem({ name: '', category: 'kitchen' });
                                } else {
                                  // Eğer menüde yoksa, sadece isimle ekle
                                  setCampaignItems([...campaignItems, {
                                    id: Date.now().toString(),
                                    name: newCampaignItem.name,
                                    category: newCampaignItem.category
                                  }]);
                                  setNewCampaignItem({ name: '', category: 'kitchen' });
                                }
                              }
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                          >
                            ➕ Ekle
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">Menüden seçebilir veya yeni ürün adı yazabilirsiniz</p>
                      </div>
                      {campaignItems.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-semibold text-gray-700">Eklenen İçerikler:</p>
                          <div className="space-y-2">
                            {campaignItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    item.category === 'kitchen' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {item.category === 'kitchen' ? '🍳' : '🍹'}
                                  </span>
                                  <span className="font-medium text-gray-800">{item.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCampaignItems(campaignItems.filter((_, i) => i !== idx))}
                                  className="text-red-500 hover:text-red-700 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addingMenuItem}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    {addingMenuItem ? '⏳ Ekleniyor...' : editingItem ? '💾 Güncelle' : '✅ Ürün Ekle'}
                  </button>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setNewMenuItem({ name: '', price: '', category: 'kitchen', menuCategory: 'food', extras: '' });
                        setCampaignItems([]);
                        setNewCampaignItem({ name: '', category: 'kitchen' });
                      }}
                      className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-200"
                    >
                      İptal
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📋 Menü ({menu.length} ürün)
              </h3>
              {menu.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">📋</div>
                  <p className="text-gray-500 font-medium">Henüz ürün yok</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menu.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-800">{item.name}</h4>
                          <p className="text-2xl font-bold text-green-600 mt-1">{item.price} ₺</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setNewMenuItem({
                                name: item.name,
                                price: item.price.toString(),
                                category: item.category,
                                menuCategory: item.menuCategory || item.category,
                                extras: item.extras || ''
                              });
                              setCampaignItems(item.items || []);
                              setNewCampaignItem({ name: '', category: 'kitchen' });
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-all"
                            title="Düzenle"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-all"
                            title="Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          item.category === 'kitchen' ? 'bg-orange-100 text-orange-800' :
                          item.category === 'bar' ? 'bg-purple-100 text-purple-800' :
                          item.category === 'dessert' ? 'bg-pink-100 text-pink-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.category === 'kitchen' ? '🍳 Mutfak' :
                           item.category === 'bar' ? '🍹 Bar' :
                           item.category === 'dessert' ? '🍰 Tatlı' :
                           '🎁 Kampanya'}
                        </span>
                        <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800">
                          {item.menuCategory === 'food' ? '🍽️ Yemek' :
                           item.menuCategory === 'drink' ? '🥤 İçecek' :
                           item.menuCategory === 'dessert' ? '🍰 Tatlı' :
                           '🎁 Kampanya'}
                        </span>
                      </div>
                      {item.items && item.items.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p className="font-semibold">İçerik:</p>
                          <ul className="list-disc list-inside">
                            {item.items.map((campaignItem, idx) => (
                              <li key={idx}>
                                {campaignItem.name} 
                                <span className={`ml-1 px-1 rounded ${
                                  campaignItem.category === 'kitchen' ? 'bg-orange-100' : 'bg-purple-100'
                                }`}>
                                  {campaignItem.category === 'kitchen' ? '🍳' : '🍹'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.extras && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p className="font-semibold">Extras:</p>
                          <p className="text-gray-700 bg-gray-50 p-2 rounded">{item.extras}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Şube Değiştirme Modal */}
      {showBranchSwitchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Şube Değiştir
            </h3>
            <p className="text-gray-600 mb-4">
              Şube değiştirmek için PIN'inizi girin:
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hedef Şube
                </label>
                <select
                  value={branchSwitchTarget}
                  onChange={(e) => setBranchSwitchTarget(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Şube Seçiniz</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN
                </label>
                <input
                  type="password"
                  value={branchSwitchPin}
                  onChange={(e) => setBranchSwitchPin(e.target.value)}
                  placeholder="PIN girin"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleBranchSwitch}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-semibold transition-all"
              >
                Onayla
              </button>
              <button
                onClick={() => {
                  setShowBranchSwitchModal(false);
                  setBranchSwitchPin('');
                  setBranchSwitchTarget('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
