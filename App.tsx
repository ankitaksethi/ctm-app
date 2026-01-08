import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  FlaskConical,
  Dna,
  Activity,
  Stethoscope,
  AlertCircle,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import SearchForm from "./components/SearchForm";
import TaxonomyGroup from "./components/TaxonomyGroup";
import TrialCard from "./components/TrialCard";
import EligibilityChat from "./components/EligibilityChat";

import { useTrialSearch } from "./hooks/useTrialSearch";
import type { FlattenedTrial } from "./types";

function App() {
  const [condition, setCondition] = useState("nash");
  const [age, setAge] = useState(26);
  const [activeChatTrial, setActiveChatTrial] = useState<FlattenedTrial | null>(null);

  // Mobile-only: bottom sheet for filters
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const {
    step,
    error,
    taxonomy,
    selectedTerms,
    setSelectedTerms,
    finalFilteredTrials,
    progress,

    // pagination (NEW)
    page,
    pageSize,
    totalPages,
    totalFilteredTrials,
    setPage,

    // actions
    search,
    toggleTerm,
    reset,
  } = useTrialSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(condition, age);
  };

  // Prevent background scroll when overlays are open
  useEffect(() => {
    const locked = showMobileFilters || !!activeChatTrial;
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showMobileFilters, activeChatTrial]);

  const canShowFilters = useMemo(() => {
    return step === "results" && !!taxonomy;
  }, [step, taxonomy]);

  // Pagination range label (Showing X–Y of N)
  const showingLabel = useMemo(() => {
    if (step !== "results") return "";
    if (totalFilteredTrials === 0) return "Showing 0 results";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalFilteredTrials);
    return `Showing ${start}–${end} of ${totalFilteredTrials}`;
  }, [step, page, pageSize, totalFilteredTrials]);

  return (
    <div className="min-h-screen pb-20 bg-slate-50 selection:bg-blue-100">
      {/* Header */}
      <header
        className={`bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 transition-all ${
          step === "idle" ? "py-4 md:py-5" : "py-2.5 md:py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <div
            className="flex items-center gap-3 text-blue-600 font-black text-xl md:text-2xl tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => reset()}
          >
            <FlaskConical className="w-8 h-8 md:w-9 md:h-9" />
            <span className="hidden md:inline">TrialMatch AI</span>
            <span className="md:hidden">TrialMatch</span>
          </div>

          {step !== "idle" && (
            <div className="hidden md:block w-full max-w-xl">
              <SearchForm
                condition={condition}
                setCondition={setCondition}
                age={age}
                setAge={setAge}
                onSubmit={handleSearch}
                isSubmitting={step === "fetching" || step === "categorizing"}
                layout="header"
              />
            </div>
          )}

          <div className="hidden lg:flex items-center gap-4">
            <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-2 rounded-full border border-slate-100 uppercase tracking-widest">
              Ver 2.5 • Native AI
            </div>
          </div>
        </div>

        {/* Mobile: show compact search bar in header on results screen */}
        {step !== "idle" && (
          <div className="md:hidden px-4 sm:px-6 pb-3">
            <SearchForm
              condition={condition}
              setCondition={setCondition}
              age={age}
              setAge={setAge}
              onSubmit={handleSearch}
              isSubmitting={step === "fetching" || step === "categorizing"}
              layout="header"
            />
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {step === "idle" && (
          <div className="flex flex-col items-center justify-center py-10 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-24 h-24 md:w-28 md:h-28 rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(37,99,235,0.3)] mb-10 md:mb-12 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <FlaskConical className="w-12 h-12 md:w-14 md:h-14 text-white" />
            </div>

            <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 md:mb-8 text-center tracking-tight leading-[1.1]">
              Smart Clinical Trial Search <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Simplified by AI.
              </span>
            </h1>

            <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto text-center mb-10 md:mb-14 leading-relaxed font-medium px-2">
              We process complex eligibility criteria and medical taxonomy to find trials that actually matter to you.
            </p>

            <SearchForm
              condition={condition}
              setCondition={setCondition}
              age={age}
              setAge={setAge}
              onSubmit={handleSearch}
              isSubmitting={false}
              layout="hero"
            />

            {/* Feature cards hidden on mobile */}
            <div className="hidden sm:grid mt-24 grid-cols-1 sm:grid-cols-3 gap-10 w-full max-w-5xl">
              {[
                { icon: <Dna />, title: "Genetic Filters", desc: "Automated hereditary condition mapping.", color: "blue" },
                { icon: <Activity />, title: "Recent Events", desc: "Identify acute states and recent surgeries.", color: "emerald" },
                { icon: <Stethoscope />, title: "Precision Search", desc: "Real-time verification of study protocols.", color: "indigo" },
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${
                      feature.color === "emerald"
                        ? "bg-emerald-50 text-emerald-600"
                        : feature.color === "indigo"
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {React.cloneElement(feature.icon as React.ReactElement<{ className?: string }>, {
                      className: "w-7 h-7",
                    })}
                  </div>
                  <h3 className="font-black text-slate-800 mb-3 text-lg">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(step === "fetching" || step === "categorizing") && (
          <div className="flex flex-col items-center justify-center py-28 md:py-40 space-y-8 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 border-[6px] border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FlaskConical className="w-9 h-9 md:w-10 md:h-10 text-blue-600 animate-pulse" />
              </div>
            </div>

            <div className="text-center px-4 max-w-xl">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">
                {step === "fetching" ? "Syncing with ClinicalTrials.gov" : "Generating Medical Taxonomy"}
              </h2>

              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                {step === "fetching"
                  ? "Retrieving latest recruiting protocol data..."
                  : "Gemini is classifying conditions into genetic and acute categories..."}
              </p>

              {/* NEW: verbose loading details */}
              {progress && (
                <div className="mt-4 text-xs text-slate-500 font-medium leading-relaxed">
                  <div>
                    Found <span className="font-black text-slate-800">{progress.rawTrials}</span> recruiting trials.
                    {" "}
                    Age-matched: <span className="font-black text-slate-800">{progress.ageFilteredTrials}</span>.
                  </div>

                  {progress.uniqueConditions > 0 && (
                    <div className="mt-1">
                      Extracted <span className="font-black text-slate-800">{progress.uniqueConditions}</span> unique condition keywords.
                    </div>
                  )}

                  {progress.masterTerms > 0 && (
                    <div className="mt-1">
                      Compiled into <span className="font-black text-slate-800">{progress.masterTerms}</span> master terms across{" "}
                      <span className="font-black text-slate-800">3</span> buckets:
                      {" "}
                      <span className="font-black text-slate-800">{progress.bucketCounts.Genetic}</span> genetic,{" "}
                      <span className="font-black text-slate-800">{progress.bucketCounts.RecentEvents}</span> recent events,{" "}
                      <span className="font-black text-slate-800">{progress.bucketCounts.OtherMajorDiagnosis}</span> major diagnoses.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-2 border-rose-100 text-rose-700 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] mb-10 flex items-start gap-5 shadow-sm animate-in shake duration-500">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-rose-100 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h3 className="font-black text-rose-800 mb-1.5 text-lg md:text-xl tracking-tight">Analysis Error</h3>
              <p className="text-sm font-medium opacity-80 leading-relaxed max-w-md">{error}</p>
              <button
                onClick={() => reset()}
                className="mt-4 bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-800 transition-colors"
              >
                Restart Search
              </button>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Desktop Sidebar Filters */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm sticky top-28">
                <h3 className="font-black text-slate-900 mb-8 flex items-center gap-3 border-b border-slate-50 pb-6 tracking-tight">
                  <Activity className="w-6 h-6 text-blue-600" />
                  Smart Taxonomy
                </h3>

                {taxonomy && (
                  <div className="space-y-10">
                    <TaxonomyGroup
                      title="Genetic Factors"
                      icon={<Dna className="w-4 h-4 text-indigo-500" />}
                      terms={taxonomy.summary.Genetic}
                      selected={selectedTerms}
                      onToggle={toggleTerm}
                    />
                    <TaxonomyGroup
                      title="Recent Events"
                      icon={<Activity className="w-4 h-4 text-emerald-500" />}
                      terms={taxonomy.summary.RecentEvents}
                      selected={selectedTerms}
                      onToggle={toggleTerm}
                    />
                    <TaxonomyGroup
                      title="Major Diagnoses"
                      icon={<Stethoscope className="w-4 h-4 text-rose-500" />}
                      terms={taxonomy.summary.OtherMajorDiagnosis}
                      selected={selectedTerms}
                      onToggle={toggleTerm}
                    />
                  </div>
                )}

                {!taxonomy && (
                  <p className="text-slate-400 text-xs italic font-medium">
                    No secondary medical factors found for this condition.
                  </p>
                )}

                {selectedTerms.size > 0 && (
                  <button
                    onClick={() => setSelectedTerms(new Set())}
                    className="w-full mt-10 py-3 text-[10px] font-black text-slate-400 hover:text-rose-600 border border-dashed border-slate-200 rounded-2xl transition-all uppercase tracking-widest"
                  >
                    Reset {selectedTerms.size} Active Filters
                  </button>
                )}
              </div>
            </div>

            {/* Trial List */}
            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 md:gap-6 mb-2 md:mb-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                    Available Protocols
                  </h2>

                  <p className="text-slate-500 text-sm font-medium mt-1">
                    {showingLabel} for{" "}
                    <span className="font-bold text-slate-800 capitalize">"{condition}"</span>.
                  </p>
                </div>

                {selectedTerms.size > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedTerms).slice(0, 3).map((term) => (
                      <span
                        key={term}
                        className="bg-blue-600 text-white text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-md shadow-blue-100"
                      >
                        {term}
                      </span>
                    ))}
                    {selectedTerms.size > 3 && (
                      <span className="text-[10px] text-slate-400 font-black pt-1">
                        +{selectedTerms.size - 3} MORE
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination controls (Top) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 font-black text-xs uppercase tracking-widest disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>

                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Page <span className="text-slate-900">{page}</span> / {totalPages}
                  </div>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 font-black text-xs uppercase tracking-widest disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {finalFilteredTrials.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-24 text-center shadow-sm">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Search className="w-8 h-8 md:w-10 md:h-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-3 tracking-tight">
                    Zero Matches Found
                  </h3>
                  <p className="text-slate-400 mb-8 font-medium">
                    Your specific combination of taxonomy filters returned no results.
                  </p>
                  <button
                    onClick={() => setSelectedTerms(new Set())}
                    className="bg-blue-600 text-white px-8 md:px-10 py-4 rounded-2xl font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                    type="button"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  {finalFilteredTrials.map((trial: FlattenedTrial) => (
                    <TrialCard
                      key={trial.nctId}
                      trial={trial}
                      onVerify={() => setActiveChatTrial(trial)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination controls (Bottom) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-black text-xs uppercase tracking-widest disabled:opacity-40"
                  >
                    Prev
                  </button>

                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Page <span className="text-slate-900">{page}</span> / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-black text-xs uppercase tracking-widest disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile floating Filters button */}
      {canShowFilters && (
        <button
          className="lg:hidden fixed bottom-5 right-5 z-40 bg-blue-600 text-white px-5 py-3 rounded-full font-black shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center gap-2"
          onClick={() => setShowMobileFilters(true)}
          type="button"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
          {selectedTerms.size > 0 && (
            <span className="ml-1 text-[10px] bg-white/20 px-2 py-1 rounded-full">
              {selectedTerms.size}
            </span>
          )}
        </button>
      )}

      {/* Mobile Filters Bottom Sheet */}
      {showMobileFilters && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setShowMobileFilters(false)}
          role="presentation"
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 max-h-[82vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-black text-slate-900 tracking-tight text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Smart Taxonomy
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 rounded-xl hover:bg-slate-100"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {taxonomy ? (
              <div className="space-y-8 pb-4">
                <TaxonomyGroup
                  title="Genetic Factors"
                  icon={<Dna className="w-4 h-4 text-indigo-500" />}
                  terms={taxonomy.summary.Genetic}
                  selected={selectedTerms}
                  onToggle={toggleTerm}
                />
                <TaxonomyGroup
                  title="Recent Events"
                  icon={<Activity className="w-4 h-4 text-emerald-500" />}
                  terms={taxonomy.summary.RecentEvents}
                  selected={selectedTerms}
                  onToggle={toggleTerm}
                />
                <TaxonomyGroup
                  title="Major Diagnoses"
                  icon={<Stethoscope className="w-4 h-4 text-rose-500" />}
                  terms={taxonomy.summary.OtherMajorDiagnosis}
                  selected={selectedTerms}
                  onToggle={toggleTerm}
                />
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic font-medium pb-6">
                No secondary medical factors found for this condition.
              </p>
            )}

            <div className="sticky bottom-0 bg-white pt-3 pb-2 border-t border-slate-100">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTerms(new Set())}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 font-black text-slate-600 text-xs uppercase tracking-widest"
                  type="button"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all"
                  type="button"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Chat Overlay */}
      {activeChatTrial && (
        <div className="fixed inset-0 z-50 md:static">
          <EligibilityChat trial={activeChatTrial} onClose={() => setActiveChatTrial(null)} />
        </div>
      )}
    </div>
  );
}

export default App;
