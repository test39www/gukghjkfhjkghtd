import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { theme } from "../theme"

export function EmptyState({
  title = "Ничего не найдено",
  subtitle,
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: theme.colors.bg,
  },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: "600" },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
})
