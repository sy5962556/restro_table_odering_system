import React, { useState } from 'react';
import { X, Bell, Droplets, Utensils, Receipt, HelpCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const reasons = [
  { id: 'Need Water', label: 'Bring Drinking Water', icon: Droplets },
  { id: 'Need Cutlery', label: 'Need Extra Cutlery / Plates', icon: Utensils },
  { id: 'Request Bill', label: 'Request Printed Bill', icon: Receipt },
  { id: 'Need Assistance', label: 'General Assistance / Question', icon: HelpCircle }
];

export const WaiterCallModal = ({ restaurantId, tableNumber, onClose }) => {
  const [selectedReason, setSelectedReason] = useState('Need Water');
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await api.post('/waiter-calls', {
        restaurantId,
        tableNumber,
        reason: selectedReason,
        note: customNote
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2200);
      }
    } catch (err) {
      alert(err.message || 'Could not notify waiter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-6 space-y-3 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Staff Notified!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Our floor manager or server has been alerted and will arrive at Table #{tableNumber} right away.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-glow">
                🔔
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Call Waiter</h3>
                <p className="text-xs text-slate-400">Table #{tableNumber} Assistance</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                What can we help you with?
              </label>
              {reasons.map((r) => {
                const IconComponent = r.icon;
                const isSelected = selectedReason === r.id;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-900 dark:text-brand-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-brand-500' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs">{r.label}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Optional notes for staff..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-500 to-amber-600 shadow-glow hover:brightness-105 active:scale-95 transition-all"
            >
              {isSubmitting ? 'SENDING ALERT...' : 'NOTIFY WAITER NOW'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WaiterCallModal;
