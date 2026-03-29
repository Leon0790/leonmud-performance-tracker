import React, { useState } from 'react';
import { Clock, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrialBanner({ daysLeft }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const urgency = daysLeft <= 2;

  return (
    <div className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-sm ${urgency ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Clock className="w-4 h-4 shrink-0" />
        <span className="font-medium">
          {urgency
            ? `⚠️ Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}! Upgrade to keep your premium features.`
            : `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Enjoy full access while it lasts!`}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/my-payment"
          className="flex items-center gap-1 bg-white text-amber-700 font-bold text-xs px-3 py-1 rounded-full hover:bg-amber-50 transition-colors"
          style={{ color: urgency ? '#b91c1c' : '#92400e' }}
        >
          <Sparkles className="w-3 h-3" /> Upgrade — KES 200
        </Link>
        <button onClick={() => setDismissed(true)} className="opacity-80 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}