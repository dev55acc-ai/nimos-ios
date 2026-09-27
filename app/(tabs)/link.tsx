// LINK — point the app at the spine. Token is stored on-device only.
import { useEffect, useState } from "react";
import { View, TextInput, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated from "react-native-reanimated";
import { C, RADIUS } from "../../src/theme";
import { useType } from "../../src/type";
import { useReduceMotion } from "../../src/a11y";
import { getConn, setConn, isLinked, getAgents, getMedia } from "../../src/api";
import { VoltButton, Glass } from "../../components/ui";
import { useRise } from "../../src/motion";

const field = {
  backgroundColor: C.card,
  borderColor: C.cardLine,
  borderWidth: 1,
  borderRadius: RADIUS.btn,
  paddingHorizontal: 16,
  paddingVertical: 14,
  color: C.txt,
  fontSize: 15,
} as const;

export default function LinkScreen() {
  const insets = useSafeAreaInsets();
  const t = useType();
  const reduce = useReduceMotion();
  const rise = useRise(reduce ? 0 : 16, reduce ? 1 : 700);

  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [check, setCheck] = useState<string | null>(null);

  useEffect(() => {
    void getConn().then((c) => {
      setUrl(c.url);
      setToken(c.token);
    });
  }, []);

  const connect = async () => {
    if (!url.trim() || !token.trim()) return Alert.alert("Both fields needed");
    setBusy(true);
    setCheck(null);
    const clean = { url: url.trim().replace(/\/$/, ""), token: token.trim() };
    try {
      // prove it against the real endpoints before saving
      const [agents, media] = await Promise.all([getAgents(), getMedia({ limit: 5 })]);
      await setConn(clean);
      setCheck(`${agents.length} agents · ${media.media.length}+ media reachable`);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setCheck(null);
      Alert.alert("The spine refused that", (e as Error).message);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={{
          padding: 28,
          paddingTop: Math.max(insets.top, 16) + 28,
          paddingBottom: 140 + insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={["rgba(183,255,46,0.12)", "transparent"]}
          style={{ position: "absolute", width: 420, height: 420, borderRadius: 210, top: 40, right: -120 }}
        />
        <Animated.View style={rise}>
          <Animated.Text
            style={[t.wordmark, { fontSize: 48, letterSpacing: -2.6, color: C.txt }]}
            accessibilityRole="header"
          >
            nimos
            <Animated.Text style={{ color: C.acc }}>.</Animated.Text>
          </Animated.Text>
          <Animated.Text style={[t.body, { marginTop: 10, color: C.dim, maxWidth: 290 }]}>
            your fleet, in your hand. every CEO, every funnel, one tap away.
          </Animated.Text>
        </Animated.View>

        <View style={{ marginTop: 36, gap: 10 }}>
          <Animated.Text style={[t.label, { color: C.dim2 }]}>Spine URL</Animated.Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://xxxx.trycloudflare.com"
            placeholderTextColor={C.dim2}
            style={field}
            accessibilityLabel="Spine URL"
            returnKeyType="next"
          />
          <Animated.Text style={[t.label, { color: C.dim2, marginTop: 8 }]}>Nimos token</Animated.Text>
          <TextInput
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="the nimos_auth_token"
            placeholderTextColor={C.dim2}
            style={field}
            accessibilityLabel="Nimos token"
            returnKeyType="go"
            onSubmitEditing={connect}
          />
          <VoltButton
            label={busy ? "LINKING…" : isLinked({ url, token }) ? "RE-LINK" : "ENTER NIMOS"}
            full
            disabled={busy}
            onPress={connect}
            wrapperStyle={{ marginTop: 16 }}
          />
          {check ? (
            <Glass style={{ padding: 14, marginTop: 16 }}>
              <Text style={[t.caption, { color: C.acc }]}>{check}</Text>
            </Glass>
          ) : null}
          <Text style={[t.caption, { color: C.dim2, textAlign: "center", marginTop: 18 }]}>
            token is stored on this device only.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
