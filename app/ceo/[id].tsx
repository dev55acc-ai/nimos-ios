// CEO chat — the live line. Streams the reply token by token.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { C } from "../../src/theme";
import { useType, HIT } from "../../src/type";
import { haptic } from "../../src/a11y";
import {
  chat,
  createSession,
  getAgents,
  getBusinesses,
  getMessages,
  type Message,
} from "../../src/api";
import { Glass } from "../../components/ui";
import { ErrorState, Skeleton } from "../../components/States";

export default function CeoChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const agentId = String(id ?? "");
  const insets = useSafeAreaInsets();
  const t = useType();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [stream, setStream] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const who = useQuery({
    queryKey: ["ceo", agentId],
    queryFn: async () => {
      const [agents, businesses] = await Promise.all([getAgents(), getBusinesses()]);
      const agent = agents.find((a) => a.id === agentId);
      const business = businesses.find((b) => b.id === agent?.business_id);
      return { agent, business };
    },
    staleTime: 300_000,
  });

  // open a session, then load its history
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await createSession(agentId);
        if (!alive) return;
        setSessionId(s.id);
        const hist = await getMessages(s.id);
        if (alive) setMessages(hist);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
      cancelRef.current?.();
    };
  }, [agentId]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || !sessionId || sending) return;
    haptic.act();
    setDraft("");
    setSending(true);
    setStream("");
    setMessages((m) => [...m, { id: `local-${Date.now()}`, role: "user", content: text }]);

    let acc = "";
    try {
      const stop = await chat(
        agentId,
        sessionId,
        text,
        (chunk) => {
          acc += chunk;
          setStream(acc);
        },
        (real) => setSessionId(real)
      );
      cancelRef.current = stop;
      // SSE closes when the model is done; commit the reply
      const wait = setInterval(() => {}, 1_000);
      setTimeout(() => clearInterval(wait), 0);
      setMessages((m) => (acc ? [...m, { id: `ai-${Date.now()}`, role: "assistant", content: acc }] : m));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStream("");
      setSending(false);
      cancelRef.current = null;
    }
  }, [draft, sessionId, sending, agentId]);

  if (error) return <ErrorState onRetry={() => setError(null)} detail={error} />;

  const agent = who.data?.agent;
  const title = agent?.name ?? "CEO";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 10 }}>
        <Text style={[t.h1, { color: C.txt, fontSize: 24 }]} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        <Text style={[t.caption, { color: C.dim, marginTop: 2 }]} numberOfLines={1}>
          {who.data?.business?.name ?? agent?.role ?? ""}
        </Text>
      </View>

      {!sessionId ? (
        <View style={{ padding: 20 }}>
          <Skeleton height={60} />
          <Skeleton height={90} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 12, gap: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            agent?.sole_goal ? (
              <Glass style={{ padding: 14, marginBottom: 6 }}>
                <Text style={[t.label, { color: C.dim2 }]}>Sole goal</Text>
                <Text style={[t.caption, { color: C.dim, marginTop: 6 }]}>{agent.sole_goal}</Text>
              </Glass>
            ) : null
          }
          renderItem={({ item }) => (
            <Bubble role={item.role} content={item.content} />
          )}
          ListFooterComponent={
            stream ? <Bubble role="assistant" content={stream} streaming /> : sending && !stream ? (
              <View style={{ paddingVertical: 8 }}>
                <ActivityIndicator color={C.acc} />
              </View>
            ) : null
          }
        />
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 10,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 12),
          borderTopWidth: 1,
          borderTopColor: C.cardLine,
          backgroundColor: C.cardStrong,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={`Talk to ${title}`}
          placeholderTextColor={C.dim2}
          multiline
          accessibilityLabel={`Message ${title}`}
          style={{
            flex: 1,
            minHeight: HIT,
            maxHeight: 120,
            backgroundColor: C.card,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: C.cardLine,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            color: C.txt,
            fontSize: 15,
          }}
        />
        <Pressable
          onPress={send}
          disabled={!draft.trim() || !sessionId}
          accessibilityRole="button"
          accessibilityLabel="Send"
          style={({ pressed }) => ({
            width: HIT,
            height: HIT,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: draft.trim() ? C.acc : C.card,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: draft.trim() ? "#05060a" : C.dim2, fontWeight: "900", fontSize: 16 }}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ role, content, streaming }: { role: string; content: string; streaming?: boolean }) {
  const t = useType();
  const mine = role === "user";
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={{ alignItems: mine ? "flex-end" : "flex-start" }}
    >
      <View
        style={{
          maxWidth: "86%",
          backgroundColor: mine ? C.acc : C.card,
          borderWidth: mine ? 0 : 1,
          borderColor: C.cardLine,
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 11,
        }}
      >
        <Text style={[t.body, { color: mine ? "#05060a" : C.txt }]}>{content}</Text>
        {streaming ? <Text style={{ color: C.acc }}>▍</Text> : null}
      </View>
    </Animated.View>
  );
}
