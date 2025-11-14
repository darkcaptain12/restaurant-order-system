import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getApiUrl } from '../config';

interface Branch {
  id: string;
  name: string;
}

export default function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branch, setBranch] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Şubeleri yükle
    fetch(getApiUrl('/api/branches'))
      .then(res => res.json())
      .then(data => {
        setBranches(data);
        if (data.length > 0) {
          setBranch(data[0].id);
        }
      })
      .catch(err => {
        console.error('Failed to fetch branches:', err);
        // Fallback: varsayılan şubeler
        setBranches([
          { id: '1', name: 'Nilüfer' },
          { id: '2', name: 'Merkez' }
        ]);
        setBranch('1');
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!pin.trim()) {
      setError('PIN/Şifre gerekli');
      setLoading(false);
      return;
    }

    if (!branch) {
      setError('Şube seçimi gerekli');
      setLoading(false);
      return;
    }

    try {
      const result = await login(pin.trim(), branch, '');

      if (result.success && result.user) {
      const routes: Record<string, string> = {
        waiter: '/waiter',
        kitchen: '/kitchen',
        bar: '/bar',
        admin: '/admin',
        cashier: '/cashier'
      };
        navigate(routes[result.user.role]);
      } else {
        setError(result.error || 'Geçersiz PIN/Şifre');
      }
    } catch (error) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Restoran Sipariş Sistemi
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şube Seç
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              required
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
              PIN / Şifre
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN veya şifre girin"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? '⏳ Giriş yapılıyor...' : '🔐 Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
