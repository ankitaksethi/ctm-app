import { FlattenedTrial } from "../types";
import { buildAndRenameTrial } from "./dataProcessor";

const BASE_URL = "https://clinicaltrials.gov/api/v2/studies";

export async function fetchClinicalTrials(
  condition: string,
  pageSize = 100,                    // bigger pages = fewer requests
  statuses: string[] = ["RECRUITING"],
  maxStudies = 500                   // safety cap for UI responsiveness
): Promise<FlattenedTrial[]> {
  const params = new URLSearchParams({
    format: "json",
    markupFormat: "markdown",
    "query.cond": condition,
    pageSize: pageSize.toString(),
    countTotal: "true",
  });

  if (statuses.length > 0) {
    params.append("filter.overallStatus", statuses.join(","));
  }

  const all: FlattenedTrial[] = [];
  let pageToken: string | undefined = undefined;

  while (true) {
    const currentParams = new URLSearchParams(params);
    if (pageToken) currentParams.set("pageToken", pageToken);

    const resp = await fetch(`${BASE_URL}?${currentParams.toString()}`);
    if (!resp.ok) throw new Error("Failed to fetch from ClinicalTrials.gov");

    const data = await resp.json();
    const studies = data.studies || [];

    all.push(...studies.map((s: any) => buildAndRenameTrial(s)));

    pageToken = data.nextPageToken;
    if (!pageToken) break;                 // no more pages
    if (all.length >= maxStudies) break;   // cap to keep UI fast
  }

  return all.slice(0, maxStudies);
}
