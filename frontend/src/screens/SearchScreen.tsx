import React, { useState } from "react"
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../navigation"
import { theme } from "../theme"

type Nav = NativeStackNavigationProp<RootStackParamList>

export function SearchScreen() {
  const navigation = useNavigation<Nav>()
  const [query, setQuery] = useState("")

  const submit = () => {
    navigation.navigate("Results", { query: query.trim() })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Поиск видео</Text>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Введите запрос..."
        placeholderTextColor={theme.colors.textSecondary}
        returnKeyType="search"
        onSubmitEditing={submit}
        autoCorrect={false}
      />
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Найти</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        Подсказка: оставьте поле пустым и нажмите «Найти», чтобы увидеть все
        тестовые видео.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.bg },
  label: { color: theme.colors.text, fontSize: 20, fontWeight: "700", marginBottom: 16 },
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
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  hint: { color: theme.colors.textSecondary, marginTop: 16, fontSize: 13 },
})
