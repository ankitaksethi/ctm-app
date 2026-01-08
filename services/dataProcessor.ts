
import { FIELD_MAPPING } from '../constants';
import { FlattenedTrial } from '../types';

function isScalar(val: any): boolean {
  return val === null || typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean';
}

export function flattenRecord(obj: any, parentKey = '', sep = '.'): Record<string, any> {
  const items: Record<string, any> = {};

  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const k in obj) {
      const newKey = parentKey ? `${parentKey}${sep}${k}` : k;
      Object.assign(items, flattenRecord(obj[k], newKey, sep));
    }
  } else if (Array.isArray(obj)) {
    const key = parentKey || 'list';
    if (obj.every(isScalar)) {
      items[key] = obj.map(x => (x === null ? '' : String(x))).join(' | ');
    } else {
      items[key] = JSON.stringify(obj);
    }
  } else {
    items[parentKey] = obj;
  }

  return items;
}

export function buildAndRenameTrial(rawTrial: any): FlattenedTrial {
  const flattened = flattenRecord(rawTrial.study || rawTrial);
  const renamed: any = {};
  
  for (const [rawKey, flattenedValue] of Object.entries(flattened)) {
    const newKey = FIELD_MAPPING[rawKey] || rawKey;
    renamed[newKey] = flattenedValue;
  }

  // Clean age data logic from Python
  const extractAge = (val: any, defaultVal: number): number => {
    if (!val || typeof val !== 'string') return defaultVal;
    const match = val.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : defaultVal;
  };

  renamed.eligibilityMinimumAge = extractAge(renamed.eligibilityMinimumAge, 0);
  renamed.eligibilityMaximumAge = extractAge(renamed.eligibilityMaximumAge, 999);

  return renamed as FlattenedTrial;
}

export function filterByAge(trials: FlattenedTrial[], targetAge: number): FlattenedTrial[] {
  return trials.filter(trial => {
    return trial.eligibilityMinimumAge <= targetAge && trial.eligibilityMaximumAge >= targetAge;
  });
}
