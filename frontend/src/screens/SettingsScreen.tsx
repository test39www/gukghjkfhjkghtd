import React, { useEffect, useState } from "react"
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { getBackendUrl, setBackendUrl } from "../storage"
import { checkHealth } from "../api/youtube"
import { theme } from "../theme"

// Возвращает нормализованный URL или текст ошибки.
function normalizeUrl(raw: string): { url: string } | { error: string } {
  const trimmed = raw.trim().replace(/\/+$/, "")
  if (!trimmed) return { error: "URL не может быть пустым." }
  if (!/^https?:\/\//i.test(trimmed))
    return { error: "URL должен начинаться с http:// или https://" }
  return { url: trimmed }
}

export function SettingsScreen() {
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    getBackendUrl().then(setUrl)
  }, [])

  const save = async () => {
    const res = normalizeUrl(url)
    if ("error" in res) {
      setStatus(`Ошибка: ${res.error}`)
      return
    }
    await setBackendUrl(res.url)
    setUrl(res.url)
    setStatus("Сохранено ✓")
  }

  const test = async () => {
    const res = normalizeUrl(url)
    if ("error" in res) {
      setStatus(`Ошибка: ${res.error}`)
      return
    }
    setUrl(res.url)
    setStatus("Проверяем...")
    try {
      const health = await checkHealth(res.url)
      setStatus(`Сервер доступен ✓ (режим: ${health.dataSource})`)
    } catch (e) {
      setStatus(e instanceof Error ? `Ошибка: ${e.message}` : "Ошибка соединения")
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Backend URL</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="http://192.168.1.100:4000"
        placeholderTextColor={theme.colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>Сохранить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={test}>
          <Text style={styles.buttonText}>Проверить</Text>
        </TouchableOpacity>
      </View>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.bg },
  label: { color: theme.colors.text, fontSize: 16, fontWeight: "600", marginBottom: 10 },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  row: { flexDirection: "row", marginTop: 14 },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  secondary: { backgroundColor: theme.colors.surfaceAlt },
  buttonText: { color: "#fff", fontWeight: "700" },
  status: { color: theme.colors.textSecondary, marginTop: 16 },
})
