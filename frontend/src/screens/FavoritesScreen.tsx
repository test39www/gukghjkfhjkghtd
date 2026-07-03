import React, { useCallback, useState } from "react"
import { FlatList, StyleSheet, View } from "react-native"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../navigation"
import { VideoSummary } from "../types"
import { getFavorites } from "../storage"
import { VideoCard } from "../components/VideoCard"
import { EmptyState } from "../components/EmptyState"
import { theme } from "../theme"

type Nav = NativeStackNavigationProp<RootStackParamList>

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>()
  const [items, setItems] = useState<VideoSummary[]>([])

  useFocusEffect(
    useCallback(() => {
      getFavorites().then(setItems)
    }, [])
  )

  if (items.length === 0)
    return (
      <EmptyState
        title="Избранное пусто"
        subtitle="Добавляйте видео в избранное на экране просмотра."
      />
    )

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
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
})
