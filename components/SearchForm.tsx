import React from 'react';
import { Search, Loader2, ChevronRight, CheckCircle2, FlaskConical, Dna, Activity, Stethoscope, Calendar, User, MessageSquare, ExternalLink, Send, X, Bot, User as UserIcon, AlertCircle } from 'lucide-react';

interface SearchFormProps {
  condition: string;
  setCondition: (val: string) => void;
  age: number;
  setAge: (val: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  layout?: 'header' | 'hero';
}

function SearchForm({ condition, setCondition, age, setAge, onSubmit, isSubmitting, layout = 'header' }: SearchFormProps) {
  const isHero = layout === 'hero';
  
  return (
    <form onSubmit={onSubmit} className={`flex gap-3 ${isHero ? 'flex-col sm:flex-row w-full max-w-2xl bg-white p-2.5 rounded-3xl shadow-2xl' : 'max-w-md w-full'}`}>
      <div className={`flex-1 relative ${isHero ? 'sm:border-r border-slate-100 pr-2' : ''}`}>
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${isHero ? 'w-5 h-5' : 'w-4 h-4'}`} />
        <input
          type="text"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="Condition (e.g. Cirrhosis)"
          required
          className={`w-full ${isHero ? 'pl-11 pr-4 py-5 text-lg' : 'pl-10 pr-4 py-2.5 text-sm'} bg-transparent border-none focus:ring-0 outline-none text-slate-800 placeholder:text-slate-400 transition-all font-semibold`}
        />
      </div>
      <div className={`relative ${isHero ? 'w-full sm:w-36' : 'w-24'}`}>
        <User className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${isHero ? 'w-5 h-5' : 'w-4 h-4'}`} />
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(parseInt(e.target.value) || 0)}
          min="0"
          max="120"
          placeholder="Age"
          className={`w-full ${isHero ? 'pl-11 pr-4 py-5 text-lg' : 'pl-9 pr-3 py-2.5 text-sm'} bg-transparent border-none focus:ring-0 outline-none text-slate-800 placeholder:text-slate-400 transition-all font-semibold`}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shrink-0 ${isHero ? 'px-10 py-5 text-lg shadow-xl shadow-blue-200 active:scale-95' : 'px-5 py-2.5 text-sm'}`}
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        {isHero && "Find Trials"}
      </button>
    </form>
  );
}

export default SearchForm;
