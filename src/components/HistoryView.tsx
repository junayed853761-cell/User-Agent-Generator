import React from 'react';
import { History, RefreshCw, Cpu, Download } from 'lucide-react';
import { GenerationHistoryItem } from '../types';

interface HistoryViewProps {
  historyItems: GenerationHistoryItem[];
  loading: boolean;
  onRefresh: () => void;
  onReGenerate: (item: GenerationHistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyItems,
  loading,
  onRefresh,
  onReGenerate,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Generation Audit History</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Logs of previous User-Agent batch generation requests with criteria parameters and repeat shortcuts.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium border border-zinc-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* History Items: Responsive Cards on Mobile, Table on Desktop */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {historyItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-zinc-500 text-xs sm:text-sm">
            No generation runs recorded yet. Generate your first batch of User-Agents to see it recorded here.
          </div>
        ) : (
          <>
            {/* Mobile View: High-density responsive cards */}
            <div className="md:hidden divide-y divide-zinc-800/80">
              {historyItems.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono">
                      {new Date(item.generated_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700 text-xs font-mono font-semibold">
                      ≥ {item.min_confidence} Conf
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-white font-medium">
                      {item.platform || 'All OS'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 capitalize">
                      {item.device_type || 'All Devices'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                      {item.browser || 'All Browsers'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono">
                      Qty: {item.result_count} / {item.quantity}
                    </span>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => onReGenerate(item)}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-200 text-xs font-medium transition border border-zinc-700 min-h-[44px]"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Re-Run Generation</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full spreadsheet table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Device</th>
                    <th className="py-3 px-4">Browser</th>
                    <th className="py-3 px-4">Min Conf</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {historyItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-800/40">
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(item.generated_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{item.platform || 'All'}</td>
                      <td className="py-3 px-4 text-zinc-300 capitalize">{item.device_type || 'All'}</td>
                      <td className="py-3 px-4 text-zinc-300">{item.browser || 'All'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700 font-semibold">
                          ≥ {item.min_confidence}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {item.result_count} / {item.quantity}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onReGenerate(item)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 text-xs transition border border-zinc-700 min-h-[36px]"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Run Again</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
