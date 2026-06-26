import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ShieldCheck, Terminal, Users, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: number;
  action: string;
  userId: number | null;
  details: string;
  createdAt: string;
}

export default function AdminPage() {
  const { token } = useSelector((state: RootState) => state.auth);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load audit trails');
      const stats = await res.json();
      setLogs(stats.recentLogs);
    } catch (err: any) {
      setError(err.message || 'Error loading logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-saffron" />
        <div>
          <h2 className="text-2xl font-bold tracking-wide">Administrative Access Console</h2>
          <p className="text-xs text-gray-400 font-medium">Verify system parameters, authorize staff roles, and audit security events</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-purple-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Fetching system security tables...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User accounts overview card */}
          <div className="glass-card p-6 rounded-3xl md:col-span-1 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-saffron" />
              <span>Portal Authorizations</span>
            </h4>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-300">admin</span>
                <span className="px-2 py-0.5 rounded bg-saffron/15 text-saffron font-bold border border-saffron/30">ADMIN</span>
              </div>
              <div className="text-xs text-gray-500 pt-2 border-t border-white/5">
                Passwords are encrypted using 256-bit Scrypt hashes before storage. Session lifespans are governed by 24h JWT keys.
              </div>
            </div>
          </div>

          {/* Full Audit Logs console */}
          <div className="glass-card p-6 rounded-3xl md:col-span-2 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Audit Trail Console</span>
            </h4>
            <div className="border border-white/5 bg-black/45 rounded-2xl p-4 font-mono text-xs space-y-3 overflow-y-auto max-h-96">
              {logs.map((log) => (
                <div key={log.id} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>EVENT ID: {log.id}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-300">
                    <span className="text-yellow-600 font-bold uppercase">{log.action}:</span>{' '}
                    <span>{log.details}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-gray-600 text-center py-4">No audit logs indexed.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
