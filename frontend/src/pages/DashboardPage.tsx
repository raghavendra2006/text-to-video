import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FileText, Film, RefreshCw, HardDrive, Cpu, Terminal, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DashboardData {
  pressReleasesCount: number;
  generatedVideosCount: number;
  activeQueueCount: number;
  storageMb: number;
  recentReleases: any[];
  recentVideos: any[];
  languageBreakdown: { [key: string]: number };
  recentLogs: any[];
  aiUsage: {
    tokensUsed: number;
    apiCostEstimate: number;
  };
}

export default function DashboardPage() {
  const { token } = useSelector((state: RootState) => state.auth);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load dashboard statistics');
      const stats = await res.json();
      setData(stats);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-purple-400">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span>Loading portal telemetry metrics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300">
        {error || 'Error fetching dashboard stats'}
      </div>
    );
  }

  // Prep chart data
  const languages = Object.keys(data.languageBreakdown);
  const videoCounts = Object.values(data.languageBreakdown);

  const pieData = {
    labels: languages.map(l => l.toUpperCase()),
    datasets: [
      {
        label: 'Videos Count',
        data: videoCounts.length > 0 ? videoCounts : [1],
        backgroundColor: [
          '#ff671f', // saffron
          '#8b5cf6', // purple
          '#138808', // green
          '#3b82f6', // blue
          '#ec4899', // pink
          '#eab308'  // yellow
        ],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }
    ]
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-wide">Portal Telemetry Dashboard</h2>
        <p className="text-xs text-gray-400">Real-time status of local media compilers and database counts</p>
      </div>

      {/* Grid of stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Press Releases</span>
            <span className="text-3xl font-extrabold">{data.pressReleasesCount}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Videos Generated</span>
            <span className="text-3xl font-extrabold">{data.generatedVideosCount}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-tricolorGreen/10 border border-tricolorGreen/20 text-tricolorGreen">
            <Film className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Rendering Queue</span>
            <span className="text-3xl font-extrabold">{data.activeQueueCount}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-saffron/10 border border-saffron/20 text-saffron">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Storage Usage</span>
            <span className="text-3xl font-extrabold">{data.storageMb} MB</span>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Chart & AI Stats */}
        <div className="space-y-6 md:col-span-1">
          <div className="glass-card p-6 rounded-3xl">
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-6">Language Distribution</h4>
            <div className="h-64 flex items-center justify-center">
              {languages.length > 0 ? (
                <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#ccc' } } } }} />
              ) : (
                <p className="text-xs text-gray-500">No videos generated yet</p>
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl">
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>AI Token Estimates</span>
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">LLM Tokens Count:</span>
                <span className="font-mono text-purple-300 font-bold">{data.aiUsage.tokensUsed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">API Cost Estimation:</span>
                <span className="font-mono text-green-400 font-bold">${data.aiUsage.apiCostEstimate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Releases, Videos & Logs */}
        <div className="space-y-6 md:col-span-2">
          {/* Recent Press Releases */}
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Recent Press Releases</h4>
              <Link to="/generate" className="text-xs text-purple-400 hover:underline flex items-center gap-1">
                <span>Generate Video</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {data.recentReleases.map((release) => (
                <div key={release.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-sm truncate max-w-md">{release.title}</h5>
                    <span className="text-xs text-gray-500">{release.ministry} • {release.date}</span>
                  </div>
                </div>
              ))}
              {data.recentReleases.length === 0 && (
                <p className="text-xs text-gray-500 py-4 text-center">No press releases ingested yet.</p>
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="glass-card p-6 rounded-3xl">
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Audit Trail Logs</span>
            </h4>
            <div className="font-mono text-xs bg-black/40 border border-white/5 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
              {data.recentLogs.map((log) => (
                <div key={log.id} className="text-gray-400">
                  <span className="text-purple-500">[{new Date(log.createdAt).toLocaleTimeString()}]</span>{' '}
                  <span className="text-yellow-600 font-bold">{log.action}:</span>{' '}
                  <span>{log.details}</span>
                </div>
              ))}
              {data.recentLogs.length === 0 && (
                <p className="text-gray-600 text-center py-2">No activity logged.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
