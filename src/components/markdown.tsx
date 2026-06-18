import type { ReactNode } from "react";
import { Linking, Text, View } from "react-native";

// Minimal markdown renderer for the legal screens — handles headings,
// paragraphs, bullets, **bold**, and [links](url). No dependency.

const INLINE = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g;

function renderInline(text: string, key: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) {
      nodes.push(
        <Text
          key={`${key}-b${i}`}
          style={{ fontFamily: "PlusJakartaSans_700Bold", color: "#fff" }}
        >
          {m[2]}
        </Text>,
      );
    } else if (m[3]) {
      const url = m[5];
      nodes.push(
        <Text
          key={`${key}-l${i}`}
          onPress={() => Linking.openURL(url)}
          style={{ color: "#fff", textDecorationLine: "underline" }}
        >
          {m[4]}
        </Text>,
      );
    }
    last = INLINE.lastIndex;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.trim().split("\n");
  return (
    <View>
      {lines.map((raw, idx) => {
        const line = raw.trimEnd();
        const key = `md${idx}`;
        if (!line.trim()) return <View key={key} style={{ height: 12 }} />;

        if (line.startsWith("# ")) {
          return (
            <Text
              key={key}
              className="font-display text-ink"
              style={{ fontSize: 30, letterSpacing: -0.6, marginBottom: 4 }}
            >
              {line.slice(2)}
            </Text>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <Text
              key={key}
              className="font-display text-ink"
              style={{
                fontSize: 18,
                letterSpacing: -0.2,
                marginTop: 18,
                marginBottom: 2,
              }}
            >
              {line.slice(3)}
            </Text>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <View
              key={key}
              style={{ flexDirection: "row", marginTop: 6, paddingRight: 8 }}
            >
              <Text
                className="text-ink-dim"
                style={{ fontSize: 14, lineHeight: 22, marginRight: 8 }}
              >
                •
              </Text>
              <Text
                className="font-sans text-ink-dim"
                style={{ flex: 1, fontSize: 14, lineHeight: 22 }}
              >
                {renderInline(line.slice(2), key)}
              </Text>
            </View>
          );
        }
        return (
          <Text
            key={key}
            className="font-sans text-ink-dim"
            style={{ fontSize: 14, lineHeight: 22, marginTop: 8 }}
          >
            {renderInline(line, key)}
          </Text>
        );
      })}
    </View>
  );
}
