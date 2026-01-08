import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ChevronRight, CheckCircle2, FlaskConical, Dna, Activity, Stethoscope, Calendar, User, MessageSquare, ExternalLink, Send, X, Bot, User as UserIcon, AlertCircle } from 'lucide-react';
import type { FlattenedTrial } from '../types';

interface TrialCardProps {
  trial: FlattenedTrial;
  onVerify: () => void;
}

function TrialCard({ trial, onVerify }: TrialCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">{trial.nctId}</span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight mt-1.5 group-hover:text-blue-600 transition-colors">{trial.moduleBriefTitle}</h3>
          </div>
          <div className={`px-3 py-1 text-[10px] font-black rounded-full whitespace-nowrap uppercase tracking-wider ${
            trial.overallStatus === 'RECRUITING' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {trial.overallStatus}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(trial.conditions || '').split('|').slice(0, 3).map((cond, i) => (
            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-tight">
              {cond.trim()}
            </span>
          ))}
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed">
          {trial.briefSummary || trial.moduleOfficialTitle || 'No summary available.'}
        </p>

        <div className="flex items-center justify-between border-t border-slate-50 pt-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Started:</span>
              <span className="font-bold text-slate-700">{trial.startDate || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Age:</span>
              <span className="font-bold text-slate-700">{trial.eligibilityMinimumAge}-{trial.eligibilityMaximumAge}y</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onVerify(); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Verify Eligibility
            </button>
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 text-sm font-bold hover:text-slate-900 p-2 transition-colors"
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="bg-slate-50 border-t border-slate-100 p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Official Title</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{trial.moduleOfficialTitle || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Taxonomy Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {trial.master_diagnoses && trial.master_diagnoses.length > 0 ? (
                    trial.master_diagnoses.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] px-2.5 py-1 rounded-lg border border-blue-100 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No specific taxonomy tags.</span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Eligibility Criteria</h4>
              <div className="text-[10px] text-slate-600 whitespace-pre-wrap max-h-48 overflow-y-auto bg-white p-4 rounded-xl border border-slate-200 leading-relaxed font-mono">
                {trial.eligibilityCriteria || 'Contact clinical site for criteria details.'}
              </div>
              <a 
                href={`https://clinicaltrials.gov/study/${trial.nctId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-blue-600 text-xs font-bold hover:underline"
              >
                Detailed Protocol Source <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



export default TrialCard;
