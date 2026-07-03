import React, { useCallback, useState } from "react"
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { useAuth } from "../context/AuthContext"
import {
  getFavorites,
  getHistory,
  getSubscriptions,
} from "../storage"
import { Loading } from "../components/Loading"
import { theme } from "../theme"
import { formatDate } from "../utils/format"

type Mode = "login" | "register"

export function AccountScreen() {
  const { user, loading, login, register, logout } = useAuth()
  const [mode, setMode] = useState<Mode>("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [stats, setStats] = useState({ history: 0, favorites: 0, subs: 0 })

  useFocusEffect(
    useCallback(() => {
      let active = true
      Promise.all([getHistory(), getFavorites(), getSubscriptions()]).then(
        ([h, f, s]) => {
          if (active)
            setStats({ history: h.length, favorites: f.length, subs: s.length })
        }
      )
      return () => {
        active = false
      }
    }, [user])
  )

  const submit = async () => {
    setStatus(null)
    setBusy(true)
    try {
      if (mode === "login") await login(username, password)
      else await register(username, password)
      setUsername("")
      setPassword("")
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setBusy(false)
    }
  }

  const onLogout = async () => {
    await logout()
    setStatus(null)
  }

  if (loading) return <Loading />

  // --- Авторизован: профиль ------------------------------------------
  if (user) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={ { padding: 20 } }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.username.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.since}>
          Аккаунт создан: {formatDate(user.createdAt)}
        </Text>

        <View style={styles.statsRow}>
          <Stat label="История" value={stats.history} />
          <Stat label="Избранное" value={stats.favorites} />
          <Stat label="Подписки" value={stats.subs} />
        </View>

        <Text style={styles.hint}>
          История, избранное и подписки хранятся отдельно для каждого
          аккаунта на этом устройстве.
        </Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // --- Не авторизован: форма входа/регистрации ------------------------
  return (
    <ScrollView style={styles.container} contentContainerStyle={ { padding: 20 } }>
      <Text style={styles.title}>
        {mode === "login" ? "Вход в аккаунт" : "Создание аккаунта"}
      </Text>
      <Text style={styles.subtitle}>
        Локальный профиль на устройстве — без Google и без сервера.
        Разделяет историю, избранное и подписки между профилями.
      </Text>

      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Имя пользователя"
        placeholderTextColor={theme.colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Пароль"
        placeholderTextColor={theme.colors.textSecondary}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={submit}
        disabled={busy}
      >
        <Text style={styles.buttonText}>
          {busy
            ? "Подождите..."
            : mode === "login"
            ? "Войти"
            : "Зарегистрироваться"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchBtn}
        onPress={() => {
          setMode(mode === "login" ? "register" : "login")
          setStatus(null)
        }}
      >
        <Text style={styles.switchText}>
          {mode === "login"
            ? "Нет аккаунта? Создать"
            : "Уже есть аккаунт? Войти"}
        </Text>
      </TouchableOpacity>

      {status ? <Text style={styles.error}>{status}</Text> : null}

      <Text style={styles.guestNote}>
        Без входа приложение работает в гостевом режиме.
      </Text>
    </ScrollView>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: "700" },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
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
    marginBottom: 12,
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  switchBtn: { marginTop: 16, alignItems: "center" },
  switchText: { color: theme.colors.accent, fontWeight: "600" },
  error: { color: theme.colors.danger, marginTop: 16, textAlign: "center" },
  guestNote: {
    color: theme.colors.textSecondary,
    marginTop: 24,
    textAlign: "center",
    fontSize: 13,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "700" },
  name: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
  },
  since: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
    marginBottom: 8,
  },
  stat: { alignItems: "center" },
  statValue: { color: theme.colors.text, fontSize: 22, fontWeight: "700" },
  statLabel: { color: theme.colors.textSecondary, marginTop: 4 },
  hint: {
    color: theme.colors.textSecondary,
    marginTop: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  logoutBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 28,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  logoutText: { color: theme.colors.danger, fontWeight: "700" },
})
