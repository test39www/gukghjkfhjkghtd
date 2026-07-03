import React, { useCallback, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../navigation"
import { VideoSummary } from "../types"
import { clearHistory, getHistory } from "../storage"
import { VideoCard } from "../components/VideoCard"
import { EmptyState } from "../components/EmptyState"
import { theme } from "../theme"

type Nav = NativeStackNavigationProp<RootStackParamList>

export function HistoryScreen() {
  const navigation = useNavigation<Nav>()
  const [items, setItems] = useState<VideoSummary[]>([])

  const reload = useCallback(() => {
    getHistory().then(setItems)
  }, [])

  useFocusEffect(reload)

  const onClear = async () => {
    await clearHistory()
    reload()
  }

  if (items.length === 0)
    return <EmptyState title="История пуста" subtitle="Открытые видео появятся здесь." />

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
        <Text style={styles.clearText}>Очистить историю</Text>
      </TouchableOpacity>
      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        contentContainerStyle={ { padding: 12 } }
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={() => navigation.navigate("Video", { video: item })}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  clearBtn: { padding: 12, alignItems: "flex-end" },
  clearText: { color: theme.colors.danger, fontWeight: "600" },
})
