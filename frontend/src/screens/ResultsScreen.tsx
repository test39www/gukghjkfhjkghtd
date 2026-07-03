import React, { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../navigation"
import { VideoSummary } from "../types"
import { searchVideos } from "../api/youtube"
import { VideoCard } from "../components/VideoCard"
import { Loading } from "../components/Loading"
import { ErrorView } from "../components/ErrorView"
import { EmptyState } from "../components/EmptyState"
import { theme } from "../theme"

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, "Results">

const LIMIT = 5

export function ResultsScreen() {
  const navigation = useNavigation<Nav>()
  const { query } = useRoute<Route>().params

  const [items, setItems] = useState<VideoSummary[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (replace) setLoading(true)
      else setLoadingMore(true)
      setError(null)
      try {
        const res = await searchVideos(query, nextPage, LIMIT)
        setItems((prev) => (replace ? res.results : [...prev, ...res.results]))
        setPage(res.page)
        setHasMore(res.hasMore)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Неизвестная ошибка")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [query]
  )

  useEffect(() => {
    loadPage(1, true)
  }, [loadPage])

  if (loading) return <Loading label="Ищем видео..." />
  if (error && items.length === 0)
    return <ErrorView message={error} onRetry={() => loadPage(1, true)} />
  if (items.length === 0)
    return (
      <EmptyState
        title="Ничего не найдено"
        subtitle={`По запросу «${query}» нет результатов.`}
      />
    )

  return (
    <View style={styles.container}>
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
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => loadPage(page + 1, false)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color={theme.colors.text} />
              ) : (
                <Text style={styles.moreText}>Загрузить ещё</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  moreBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  moreText: { color: theme.colors.text, fontWeight: "700" },
})
