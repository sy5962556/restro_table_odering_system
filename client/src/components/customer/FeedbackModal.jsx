import React, { useState } from 'react';
import { X, Star, Heart, CheckCircle2, MessageSquare } from 'lucide-react';
import api from '../../services/api';

export const FeedbackModal = ({ order, restaurantId, onClose }) => {
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const availableTags = ['Delicious Food', 'Lightning Fast', 'Polite Staff', 'Great Ambience', 'Clean Tables', 'Value for Money'];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/feedback', {
        restaurantId,
        orderId: order?._id,
        tableNumber: order?.tableNumber || '01',
        customerName: order?.customer?.name || 'Valued Guest',
        customerMobile: order?.customer?.mobile,
        foodRating,
        serviceRating,
        overallRating,
        comment,
        tags: selectedTags
      });

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      alert(err.message || 'Could not submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-3 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-3xl">
              ✨
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Thank You!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your feedback helps our culinary team continuously craft exceptional dining experiences.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl mb-2 shadow-glow">
                ⭐
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">How was your dining experience?</h3>
              <p className="text-xs text-slate-400">Order #{order?.orderNumber?.split('-')[2] || '0001'} • Table #{order?.tableNumber}</p>
            </div>

            {/* Overall Star Rating */}
            <div className="flex justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOverallRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      star <= overallRating 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-slate-300 dark:text-slate-700'
                    }`} 
                  />
                </button>
              ))}
            </div>

            {/* Sub ratings */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Food Quality</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFoodRating(s)}
                    >
                      <Star className={`w-4 h-4 ${s <= foodRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Staff & Service</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setServiceRating(s)}
                    >
                      <Star className={`w-4 h-4 ${s <= serviceRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Compliment Tags */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                What did you like the most?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-white font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any compliments or suggestions..."
                className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-glow hover:brightness-105 active:scale-95 transition-all"
            >
              {isSubmitting ? 'SUBMITTING REVIEW...' : 'SUBMIT FEEDBACK'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
