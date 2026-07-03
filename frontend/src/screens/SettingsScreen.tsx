import React, { useCallback, useState } from "react"
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import {
  DEFAULT_BACKEND_URL,
  DEFAULT_REGION,
  clearFavorites,
  clearHistory,
  clearSubscriptions,
  getBackendUrl,
  getRegion,
  setBackendUrl,
  setRegion,
} from "../storage"
import { checkHealth } from "../api/youtube"
import { useAuth } from "../context/AuthContext"
import { theme } from "../theme"

// Возвращает нормализованный URL или текст ошибки.
function normalizeUrl(raw: string): { url: string } | { error: string } {
  const trimmed = raw.trim().replace(/\/+$/, "")
  if (!trimmed) return { error: "URL не может быть пустым." }
  if (!/^https?:\/\//i.test(trimmed))
    return { error: "URL должен начинаться с http:// или https://" }
  return { url: trimmed }
}

const APP_VERSION = "1.1.0"

export function SettingsScreen() {
  const { user } = useAuth()
  const [url, setUrl] = useState("")
  const [region, setRegionState] = useState(DEFAULT_REGION)
  const [status, setStatus] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      getBackendUrl().then(setUrl)
      getRegion().then(setRegionState)
    }, [])
  )

  const save = async () => {
    const res = normalizeUrl(url)
    if ("error" in res) {
      setStatus(`Ошибка: ${res.error}`)
      return
    }
    await setBackendUrl(res.url)
    await setRegion(region || DEFAULT_REGION)
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
      setStatus(
        `Сервер доступен ✓ (режим: ${health.dataSource}${
          health.region ? `, регион: ${health.region}` : ""
        })`
      )
    } catch (e) {
      setStatus(e instanceof Error ? `Ошибка: ${e.message}` : "Ошибка соединения")
    }
  }

  const resetUrl = async () => {
    await setBackendUrl(DEFAULT_BACKEND_URL)
    setUrl(DEFAULT_BACKEND_URL)
    setStatus("URL сброшен к значению по умолчанию.")
  }

  const confirmClear = (
    title: string,
    message: string,
    action: () => Promise<void>
  ) => {
    Alert.alert(title, message, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Очистить",
        style: "destructive",
        onPress: async () => {
          await action()
          setStatus(`${title}: готово ✓`)
        },
      },
    ])
  }

  const scope = user ? `аккаунта «${user.username}»` : "гостевого режима"

  return (
    <ScrollView style={styles.container} contentContainerStyle={ { padding: 20 } }>
      {/* --- Подключение --- */}
      <Text style={styles.section}>Подключение</Text>
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
      <TouchableOpacity style={styles.linkBtn} onPress={resetUrl}>
        <Text style={styles.linkText}>Сбросить к значению по умолчанию</Text>
      </TouchableOpacity>

      {/* --- Рекомендации --- */}
      <Text style={styles.section}>Рекомендации</Text>
      <Text style={styles.label}>Регион трендов (ISO, напр. US, RU, DE, GB)</Text>
      <TextInput
        style={styles.input}
        value={region}
        onChangeText={(t) => setRegionState(t.toUpperCase())}
        placeholder="US"
        placeholderTextColor={theme.colors.textSecondary}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={2}
      />
      <Text style={styles.note}>
        Нажмите «Сохранить» выше, чтобы применить регион.
      </Text>

      {/* --- Данные --- */}
      <Text style={styles.section}>Данные {scope}</Text>
      <TouchableOpacity
        style={styles.dangerBtn}
        onPress={() =>
          confirmClear("Очистка истории", "Удалить всю историю просмотров?", clearHistory)
        }
      >
        <Text style={styles.dangerText}>Очистить историю</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dangerBtn}
        onPress={() =>
          confirmClear("Очистка избранного", "Удалить всё избранное?", clearFavorites)
        }
      >
        <Text style={styles.dangerText}>Очистить избранное</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dangerBtn}
        onPress={() =>
          confirmClear(
            "Очистка подписок",
            "Отписаться от всех каналов?",
            clearSubscriptions
          )
        }
      >
        <Text style={styles.dangerText}>Очистить подписки</Text>
      </TouchableOpacity>

      {/* --- О приложении --- */}
      <Text style={styles.section}>О приложении</Text>
      <Text style={styles.about}>iPad YouTube Client · версия {APP_VERSION}</Text>
      <Text style={styles.about}>Целевая платформа: iOS 12.5.8 (jailbreak)</Text>
      <Text style={styles.about}>
        Стек: React Native 0.69 · Expo SDK 46 · React Navigation 6
      </Text>
      <Text style={styles.about}>
        Источник данных: Invidious (без официального YouTube API)
      </Text>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  section: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
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
  linkBtn: { marginTop: 12 },
  linkText: { color: theme.colors.accent, fontWeight: "600" },
  note: { color: theme.colors.textSecondary, marginTop: 10, fontSize: 13 },
  dangerBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dangerText: { color: theme.colors.danger, fontWeight: "600" },
  about: { color: theme.colors.textSecondary, marginBottom: 6, lineHeight: 20 },
  status: { color: theme.colors.text, marginTop: 20, fontSize: 14 },
})
