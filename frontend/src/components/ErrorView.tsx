import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { theme } from "../theme"

export function ErrorView({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Повторить</Text>
        </TouchableOpacity>
      ) : null}
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
  message: { color: theme.colors.danger, textAlign: "center", marginBottom: 16 },
  button: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
})
