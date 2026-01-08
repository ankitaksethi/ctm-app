import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ChevronRight, CheckCircle2, FlaskConical, Dna, Activity, Stethoscope, Calendar, User, MessageSquare, ExternalLink, Send, X, Bot, User as UserIcon, AlertCircle } from 'lucide-react';
import type { FlattenedTrial, TaxonomyData } from '../types';

interface TaxonomyGroupProps { 
  title: string;
  icon: React.ReactNode;
  terms: string[];
  selected: Set<string>;
  onToggle: (term: string) => void;
}

function TaxonomyGroup({ title, icon, terms, selected, onToggle }: TaxonomyGroupProps) {
  const [open, setOpen] = useState(true);
  if (!terms || terms.length === 0) return null;

  return (
    <div className="space-y-2">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          {title}
        </div>
        <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="pl-6 space-y-1 mt-1">
          {terms.map(term => (
            <label key={term} className="flex items-center gap-2 group cursor-pointer py-0.5">
              <input 
                type="checkbox"
                checked={selected.has(term)}
                onChange={() => onToggle(term)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm ${selected.has(term) ? 'text-blue-600 font-medium' : 'text-slate-600'} group-hover:text-slate-900`}>
                {term}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface EligibilityChatProps {
  trial: FlattenedTrial;
  onClose: () => void;
}



export default TaxonomyGroup;
