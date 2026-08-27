import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, ThumbsUp, Filter } from 'lucide-react';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

function StarRating({ value, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ feedback }) {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-extrabold text-xs text-slate-900 dark:text-white">{feedback.customerName || 'Anonymous Guest'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Table {feedback.tableNumber} • {new Date(feedback.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <StarRating value={Math.round(feedback.overallRating || 0)} />
          <span className="text-xs font-black text-amber-500 ml-1">{feedback.overallRating?.toFixed(1)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Food', value: feedback.foodRating },
          { label: 'Service', value: feedback.serviceRating },
          { label: 'Ambience', value: feedback.ambienceRating },
        ].map(r => (
          <div key={r.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2">
            <p className="font-black text-xs text-amber-500">{r.value?.toFixed(1) || '–'}</p>
            <p className="text-[9px] text-slate-400">{r.label}</p>
          </div>
        ))}
      </div>

      {feedback.comment && (
        <p className="text-[10px] text-slate-600 dark:text-slate-400 italic">"{feedback.comment}"</p>
      )}

      {feedback.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {feedback.tags.map((tag, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 font-bold">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const FeedbackPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedback');
      if (res.data.success) setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  const avgOverall = feedbacks.length ? feedbacks.reduce((s, f) => s + (f.overallRating || 0), 0) / feedbacks.length : 0;
  const avgFood = feedbacks.length ? feedbacks.reduce((s, f) => s + (f.foodRating || 0), 0) / feedbacks.length : 0;
  const avgService = feedbacks.length ? feedbacks.reduce((s, f) => s + (f.serviceRating || 0), 0) / feedbacks.length : 0;
  const avgAmbience = feedbacks.length ? feedbacks.reduce((s, f) => s + (f.ambienceRating || 0), 0) / feedbacks.length : 0;

  const filtered = feedbacks.filter(f => {
    if (filterRating === 'all') return true;
    if (filterRating === 'positive') return (f.overallRating || 0) >= 4;
    if (filterRating === 'neutral') return (f.overallRating || 0) >= 3 && (f.overallRating || 0) < 4;
    if (filterRating === 'negative') return (f.overallRating || 0) < 3;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Guest Feedback & Reviews" />

        <div className="px-4 sm:px-6 py-5 space-y-5 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Overall Rating', value: avgOverall, total: feedbacks.length },
              { label: 'Food Quality', value: avgFood },
              { label: 'Service', value: avgService },
              { label: 'Ambience', value: avgAmbience },
            ].map(stat => (
              <div key={stat.label} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-black text-2xl text-amber-500">{stat.value.toFixed(1)}</span>
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                {stat.total !== undefined && (
                  <p className="text-[10px] text-slate-400">{stat.total} reviews</p>
                )}
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'All Reviews', value: 'all' },
              { label: '⭐ Positive (4+)', value: 'positive' },
              { label: '😐 Neutral (3-4)', value: 'neutral' },
              { label: '😞 Negative (<3)', value: 'negative' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterRating(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filterRating === f.value ? 'bg-brand-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(f => <ReviewCard key={f._id} feedback={f} />)}
              {filtered.length === 0 && <p className="col-span-full text-center py-12 text-slate-400 text-xs">No reviews to show.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
