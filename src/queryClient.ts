// Query client with offline persistence. The app must show the last known fleet
// state the moment it opens, on a plane or in a lift — then reconcile.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";

const persist = createSyncStoragePersister({
  // the persister expects a sync-ish storage; AsyncStorage returns promises,
  // which the sync API tolerates for our small cache sizes.
  storage: AsyncStorage as unknown as Storage,
  key: "nimos.query-cache",
  throttleTime: 4000,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      gcTime: 1000 * 60 * 60 * 24, // keep the last good fleet state for a day
      refetchOnWindowFocus: true,
      refetchInterval: 30_000,
      retry: 1,
      // never let a transient outage blank the screen
      placeholderData: (prev: unknown) => prev,
    },
    mutations: { retry: 0 },
  },
});

export const queryPersister = persist;

export const dehydrateOptions = {
  shouldDehydrateQuery: (q: { state: { status: string } }) => q.state.status === "success",
} as const;

/** Keep the cache small — it is persisted to disk on the device. */
export const MAX_CACHE_BYTES = 512 * 1024;
