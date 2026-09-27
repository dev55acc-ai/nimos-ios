// The tabs group needs an index route or expo-router's root Stack has nothing to
// resolve and the app launches to a blank screen. This was a real bug: the group
// contained only ceos/media/link, so the simulator screenshots were pure black.
//
// Entry point is CEOs, which is the app's whole premise.
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/ceos" />;
}
