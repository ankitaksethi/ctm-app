import { useCallback, useMemo, useState } from "react";
import { fetchClinicalTrials } from "../services/ctgovService";
import { filterByAge } from "../services/dataProcessor";
import { categorizeConditions } from "../services/geminiService";
import { FlattenedTrial, ProcessingStep, TaxonomyData } from "../types";

type ProgressStats = {
  rawTrials: number;
  ageFilteredTrials: number;
  uniqueConditions: number;
  masterTerms: number;
  bucketCounts: {
    Genetic: number;
    RecentEvents: number;
    OtherMajorDiagnosis: number;
  };
};

export function useTrialSearch() {
  const [step, setStep] = useState<ProcessingStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [trials, setTrials] = useState<FlattenedTrial[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyData | null>(null);
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());

  // Progress metadata for UI messaging
  const [progress, setProgress] = useState<ProgressStats | null>(null);

  // Pagination
  const pageSize = 10; // change to 12 or 15 if you want
  const [page, setPage] = useState(1);

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setTrials([]);
    setTaxonomy(null);
    setSelectedTerms(new Set());
    setProgress(null);
    setPage(1);
  }, []);

  const search = useCallback(async (condition: string, age: number) => {
    const q = condition.trim();
    if (!q) return;

    setError(null);
    setStep("fetching");
    setSelectedTerms(new Set());
    setProgress(null);
    setPage(1);

    try {
      /* -------------------------------------------
       * 1) FETCH RAW TRIALS
       * ----------------------------------------- */
      const rawTrials = await fetchClinicalTrials(q);

      /* -------------------------------------------
       * 2) AGE FILTER
       * ----------------------------------------- */
      const ageFiltered = filterByAge(rawTrials, age);
      setTrials(ageFiltered);

      setProgress({
        rawTrials: rawTrials.length,
        ageFilteredTrials: ageFiltered.length,
        uniqueConditions: 0,
        masterTerms: 0,
        bucketCounts: { Genetic: 0, RecentEvents: 0, OtherMajorDiagnosis: 0 },
      });

      if (ageFiltered.length === 0) {
        setTaxonomy(null);
        setStep("results");
        return;
      }

      /* -------------------------------------------
       * 3) EXTRACT UNIQUE CONDITIONS
       * ----------------------------------------- */
      setStep("categorizing");

      const uniqueConds = new Set<string>();
      ageFiltered.forEach((trial) => {
        (trial.conditions || "")
          .split("|")
          .map((c) => c.toLowerCase().trim())
          .filter(Boolean)
          .forEach((c) => uniqueConds.add(c));
      });

      setProgress((prev) =>
        prev ? { ...prev, uniqueConditions: uniqueConds.size } : prev
      );

      /* -------------------------------------------
       * 4) GEMINI TAXONOMY
       * ----------------------------------------- */
      const taxData = await categorizeConditions(Array.from(uniqueConds));

      const bucketCounts = {
        Genetic: taxData.summary.Genetic?.length || 0,
        RecentEvents: taxData.summary.RecentEvents?.length || 0,
        OtherMajorDiagnosis: taxData.summary.OtherMajorDiagnosis?.length || 0,
      };

      const masterTerms =
        bucketCounts.Genetic +
        bucketCounts.RecentEvents +
        bucketCounts.OtherMajorDiagnosis;

      setProgress((prev) =>
        prev ? { ...prev, masterTerms, bucketCounts } : prev
      );

      /* -------------------------------------------
       * 5) ATTACH MASTER DIAGNOSES TO TRIALS
       * ----------------------------------------- */
      const updatedTrials = ageFiltered.map((trial) => {
        const masterDiagnoses = new Set<string>();

        (trial.conditions || "")
          .split("|")
          .map((c) => c.toLowerCase().trim())
          .filter(Boolean)
          .forEach((c) => {
            const mapped = taxData.lookup[c];
            if (mapped) masterDiagnoses.add(mapped);
          });

        return {
          ...trial,
          master_diagnoses: Array.from(masterDiagnoses),
        } as FlattenedTrial;
      });

      setTrials(updatedTrials);
      setTaxonomy(taxData);
      setStep("results");
    } catch (err: any) {
      setError(err?.message || "Failed to analyze clinical data. Please try again.");
      setStep("idle");
    }
  }, []);

  const toggleTerm = useCallback((term: string) => {
    setSelectedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
    setPage(1); // reset to first page on filter change
  }, []);

  const filteredTrials = useMemo(() => {
    if (selectedTerms.size === 0) return trials;
    return trials.filter((trial) =>
      trial.master_diagnoses?.some((diag) => selectedTerms.has(diag))
    );
  }, [trials, selectedTerms]);

  const totalFilteredTrials = filteredTrials.length;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalFilteredTrials / pageSize));
  }, [totalFilteredTrials, pageSize]);

  // Clamp page if filters reduce total pages
  const safePage = Math.min(page, totalPages);

  const finalFilteredTrials = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredTrials.slice(start, start + pageSize);
  }, [filteredTrials, safePage, pageSize]);

  return {
    // state
    step,
    error,
    trials, // full (age-filtered + enriched) list
    taxonomy,
    selectedTerms,
    progress,

    // pagination
    page: safePage,
    pageSize,
    totalPages,
    totalFilteredTrials,
    setPage,

    // derived (paginated)
    finalFilteredTrials,

    // actions
    search,
    toggleTerm,
    reset,
    setSelectedTerms,
  };
}
