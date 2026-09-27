// CEOs — the only people in the app. Talk to the 27 that run the businesses.
import { View, FlatList, Text, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { C } from "../../src/theme";
import { useType, HIT } from "../../src/type";
import { haptic } from "../../src/a11y";
import { getAgents, getBusinesses, type Agent, type Business } from "../../src/api";
import { Glass } from "../../components/ui";
import { Skeleton, ErrorState, EmptyState } from "../../components/States";
import { Header } from "../../components/Header";

export default function CeosScreen() {
  const insets = useSafeAreaInsets();
  const t = useType();

  const q = useQuery({
    queryKey: ["ceo-list"],
    queryFn: async () => {
      const [agents, businesses] = await Promise.all([getAgents(), getBusinesses()]);
      const byId = new Map<string, Business>(businesses.map((b) => [b.id, b]));
      // CEO tier only — this app does not surface workers or managers
      return agents
        .filter((a) => (a.tier ?? "").toLowerCase() === "ceo")
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => ({ agent: a, business: byId.get(a.business_id ?? "") }));
    },
    staleTime: 60_000,
  });

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header />
        <View style={{ paddingHorizontal: 20, gap: 12, paddingTop: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={78} />
          ))}
        </View>
      </View>
    );
  }

  if (q.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header />
        <ErrorState onRetry={() => void q.refetch()} />
      </View>
    );
  }

  const rows = q.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.agent.id}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom, paddingTop: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={() => void q.refetch()}
            tintColor={C.acc}
            titleColor={C.dim2}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={[t.hero, { color: C.txt }]} accessibilityRole="header">
              CEOs
            </Text>
            <Text style={[t.caption, { color: C.dim, marginTop: 4 }]}>
              {rows.length} running the businesses. Tap one to talk.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState mark="queue" title="No CEOs found" note="The spine returned no agents in the ceo tier." />
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeIn.delay(Math.min(index, 6) * 24).duration(300)}>
            <CeoRow agent={item.agent} business={item.business} />
          </Animated.View>
        )}
      />
    </View>
  );
}

function CeoRow({ agent, business }: { agent: Agent; business?: Business }) {
  const t = useType();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        router.push(`/ceo/${agent.id}`);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Talk to ${agent.name}${business ? `, ${business.name}` : ""}`}
      style={({ pressed }) => ({ marginHorizontal: 20, marginBottom: 10, opacity: pressed ? 0.75 : 1 })}
    >
      <Glass style={{ flexDirection: "row", alignItems: "center", padding: 12, minHeight: HIT + 26 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.cardLine,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: C.card,
            marginRight: 14,
          }}
        >
          <Text style={[t.heading, { color: C.acc, fontWeight: "800" }]}>
            {agent.name.trim().charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[t.bodyStrong, { color: C.txt }]} numberOfLines={1}>
            {agent.name}
          </Text>
          <Text style={[t.caption, { color: C.dim, marginTop: 2 }]} numberOfLines={1}>
            {business?.name ?? agent.role}
          </Text>
        </View>
        {agent.is_active ? null : (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.dim2 }} />
        )}
      </Glass>
    </Pressable>
  );
}
