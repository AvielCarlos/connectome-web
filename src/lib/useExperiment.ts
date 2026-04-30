/**
 * useExperiment — Universal A/B testing hook for Connectome surfaces.
 *
 * Fetches all experiment assignments in one call (cached per session),
 * auto-tracks exposures, and provides a trackEvent helper.
 *
 * Usage:
 *   const { variant, trackEvent } = useExperiment('feed_card_layout');
 *   // variant is e.g. 'A' | 'B' | 'C'
 *   // trackEvent('click') sends { experiment, variant, event_type: 'click', value: 1 }
 */

import { useEffect, useState, useCallback } from 'react';
import { API_URL } from './config';
const TOKEN_KEY = 'connectome_token';
const USER_ID_KEY = 'connectome_user_id';

interface ExperimentAssignments {
  [experiment: string]: string; // experiment_name -> variant_key
}

// Session-level cache — shared across all hook instances in the same page load
let assignmentCache: ExperimentAssignments | null = null;
let assignmentFetchPromise: Promise<ExperimentAssignments> | null = null;

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function getUserId(): string {
  return localStorage.getItem(USER_ID_KEY) || '';
}

async function fetchAllAssignments(userId: string): Promise<ExperimentAssignments> {
  const token = getToken();
  if (!token || !userId) return {};
  const res = await fetch(`${API_URL}/api/ab/assignment/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`AB assignment fetch failed: ${res.status}`);
  return res.json();
}

async function getAssignments(userId: string): Promise<ExperimentAssignments> {
  if (assignmentCache) return assignmentCache;
  // Deduplicate concurrent fetches
  if (!assignmentFetchPromise) {
    assignmentFetchPromise = fetchAllAssignments(userId)
      .then((data) => {
        assignmentCache = data;
        assignmentFetchPromise = null;
        return data;
      })
      .catch((err) => {
        assignmentFetchPromise = null;
        console.warn('[useExperiment] assignment fetch failed:', err);
        return {};
      });
  }
  return assignmentFetchPromise;
}

async function trackExperimentEvent(
  experiment: string,
  variant: string,
  eventType: string,
  value = 1,
): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${API_URL}/api/ab/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        experiment_id: experiment,
        variant,
        event_type: eventType,
        value,
      }),
    });
  } catch {
    // silent — telemetry must never break the UI
  }
}

/** Clear the session-level assignment cache (e.g. after login/logout). */
export function clearExperimentCache(): void {
  assignmentCache = null;
  assignmentFetchPromise = null;
}

/**
 * Core hook. Returns { variant, trackEvent }.
 * Default variant is 'A' until assignments load.
 */
export function useExperiment(experimentName: string): {
  variant: string;
  trackEvent: (eventType: string, value?: number) => void;
} {
  const userId = getUserId();
  const [variant, setVariant] = useState<string>('A');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getAssignments(userId).then((assignments) => {
      if (cancelled) return;
      const assigned = assignments[experimentName];
      if (assigned) {
        setVariant(assigned);
      }
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, experimentName]);

  // Auto-track exposure once variant resolves
  useEffect(() => {
    if (!loaded || !userId) return;
    trackExperimentEvent(experimentName, variant, 'exposure');
  }, [loaded, experimentName, variant, userId]);

  const trackEvent = useCallback(
    (eventType: string, value = 1) => {
      trackExperimentEvent(experimentName, variant, eventType, value);
    },
    [experimentName, variant],
  );

  return { variant, trackEvent };
}

export default useExperiment;
