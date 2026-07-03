import React from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { theme } from "../theme"

export function Loading({ label = "Загрузка..." }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
  },
  text: { color: theme.colors.textSecondary, marginTop: 12 },
})
