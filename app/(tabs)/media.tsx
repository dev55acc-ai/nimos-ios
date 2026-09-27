// MEDIA — every funnel, keep or trash, in the palm of your hand.
import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, Image, RefreshControl, ScrollView } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { C } from "../../src/theme";
import { useType, HIT } from "../../src/type";
import { haptic } from "../../src/a11y";
import { getMedia, setVerdict, mediaUrl, type MediaItem } from "../../src/api";
import { Glass } from "../../components/ui";
import { ErrorState, EmptyState, Skeleton } from "../../components/States";
import { Header } from "../../components/Header";

type Filter = "all" | "kept" | "fresh" | "killed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "kept", label: "Keep" },
  { id: "fresh", label: "Fresh" },
  { id: "killed", label: "Trash" },
];

export default function MediaScreen() {
  const insets = useSafeAreaInsets();
  const t = useType();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [world, setWorld] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["media", filter],
    queryFn: () => getMedia({ status: filter === "all" ? undefined : filter, limit: 200 }),
    staleTime: 20_000,
  });

  const all = useMemo(() => q.data?.media ?? [], [q.data]);
  const worlds = useMemo(() => {
    const set = new Map<string, number>();
    for (const m of all) set.set(m.world, (set.get(m.world) ?? 0) + 1);
    return [...set.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);
  const items = useMemo(() => (world ? all.filter((m) => m.world === world) : all), [all, world]);

  const counts = useMemo(
    () => ({
      kept: all.filter((m) => m.status === "kept").length,
      fresh: all.filter((m) => m.status === "fresh").length,
      killed: all.filter((m) => m.status === "killed").length,
    }),
    [all]
  );

  const verdict = async (item: MediaItem, next: "kept" | "killed") => {
    haptic.act();
    // optimistic — the spine is authoritative but the thumb shouldn't wait
    qc.setQueryData<{ media: MediaItem[] }>(["media", filter], (old) =>
      old ? { media: old.media.map((m) => (m.id === item.id ? { ...m, status: next } : m)) } : old
    );
    try {
      await setVerdict(item.id, next);
    } finally {
      void qc.invalidateQueries({ queryKey: ["media"] });
    }
  };

  if (q.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header />
        <ErrorState onRetry={() => void q.refetch()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />

      <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
        <Text style={[t.hero, { color: C.txt }]} accessibilityRole="header">
          Media
        </Text>
        <Text style={[t.caption, { color: C.dim, marginTop: 4 }]}>
          {counts.kept} kept · {counts.fresh} fresh · {counts.killed} trashed
        </Text>
      </View>

      {/* status filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 8 }}
      >
        {FILTERS.map((f) => (
          <Chip key={f.id} label={f.label} on={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </ScrollView>

      {/* funnel (world) filter */}
      {worlds.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
        >
          <Chip label="All funnels" on={world === null} onPress={() => setWorld(null)} />
          {worlds.map(([w, n]) => (
            <Chip key={w} label={`${w} ${n}`} on={world === w} onPress={() => setWorld(w)} />
          ))}
        </ScrollView>
      )}

      {q.isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={96} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          mark="events"
          title="Nothing here"
          note={filter === "killed" ? "The trash is empty." : "No media in this funnel yet."}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 + insets.bottom, gap: 10 }}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={9}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={C.acc}
              titleColor={C.dim2}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.delay(Math.min(index, 8) * 20).duration(280)}>
              <MediaRow item={item} onVerdict={verdict} />
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useType();
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      style={{ minHeight: 34, justifyContent: "center" }}
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 17,
          borderWidth: 1,
          borderColor: on ? C.acc : C.cardLine,
          backgroundColor: on ? "rgba(183,255,46,0.12)" : C.card,
        }}
      >
        <Text style={[t.caption, { color: on ? C.acc : C.dim, fontWeight: on ? "700" : "400" }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function MediaRow({ item, onVerdict }: { item: MediaItem; onVerdict: (m: MediaItem, v: "kept" | "killed") => void }) {
  const t = useType();
  const trashed = item.status === "killed";

  return (
    <Glass style={{ flexDirection: "row", padding: 10, gap: 12, opacity: trashed ? 0.55 : 1 }}>
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: C.bg2,
          borderWidth: 1,
          borderColor: C.cardLine,
        }}
      >
        <Image
          source={{ uri: mediaUrl(item.thumb_url) }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          accessibilityLabel={item.hook ?? item.file}
        />
        {item.kind === "video" ? (
          <View style={{ position: "absolute", bottom: 3, right: 4 }}>
            <Text style={{ fontSize: 9, color: C.acc, fontWeight: "800" }}>▶</Text>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <View>
          <Text style={[t.bodyStrong, { color: C.txt }]} numberOfLines={2}>
            {item.hook ?? item.concept ?? item.file}
          </Text>
          <Text style={[t.caption, { color: C.dim2, marginTop: 2 }]} numberOfLines={1}>
            {[item.world, item.channel, item.concept].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <VerdictButton
            label="Keep"
            on={item.status === "kept"}
            onPress={() => onVerdict(item, "kept")}
          />
          <VerdictButton
            label="Trash"
            on={trashed}
            onPress={() => onVerdict(item, "killed")}
          />
        </View>
      </View>
    </Glass>
  );
}

function VerdictButton({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useType();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${label} this asset`}
      style={({ pressed }) => ({
        minHeight: 32,
        justifyContent: "center",
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: on ? C.acc : C.cardLine,
        backgroundColor: on ? "rgba(183,255,46,0.14)" : "transparent",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={[t.caption, { color: on ? C.acc : C.dim, fontWeight: on ? "700" : "400" }]}>{label}</Text>
    </Pressable>
  );
}
