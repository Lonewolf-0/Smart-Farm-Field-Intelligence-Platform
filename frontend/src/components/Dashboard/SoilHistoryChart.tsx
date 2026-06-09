import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface HistoryRecord {
  id: string;
  year: number;
  season: string;
  data: {
    layers: any[];
  };
  created_at: string;
}

interface Props {
  history: HistoryRecord[];
}

const SoilHistoryChart: React.FC<Props> = ({ history }) => {
  if (!history || history.length < 2) {
    return (
      <div className="bg-white/5 rounded-xl p-8 border border-white/5 text-center mt-6">
        <p className="text-yellow-200">More data needed for trend analysis. Run analysis each season.</p>
      </div>
    );
  }

  // Process data for charts
  // History from API is DESC (newest first). Recharts wants ASC (oldest first).
  const chartData = [...history].reverse().map(record => {
    const topLayer = record.data.layers?.[0];
    return {
      label: `${record.season} ${record.year}`,
      pH: topLayer?.ph || 0,
      OrganicCarbon: topLayer?.organicCarbon ? parseFloat((topLayer.organicCarbon / 10).toFixed(2)) : 0,
    };
  });

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <h4 className="text-sm font-semibold text-white mb-4">pH Trend</h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="pH" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <h4 className="text-sm font-semibold text-white mb-4">Organic Carbon Trend (%)</h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="OrganicCarbon" name="Organic Carbon" stroke="#4ade80" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SoilHistoryChart;
