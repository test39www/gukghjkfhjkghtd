import React, { useCallback, useState } from "react"
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../navigation"
import { Subscription, VideoSummary } from "../types"
import { getTrending, getChannel } from "../api/youtube"
import { getRegion, getSubscriptions } from "../storage"
import { VideoCard } from "../components/VideoCard"
import { Loading } from "../components/Loading"
import { ErrorView } from "../components/ErrorView"
import { EmptyState } from "../components/EmptyState"
import { theme } from "../theme"

type Nav = NativeStackNavigationProp<RootStackParamList>

// Сколько каналов из подписок грузим для ленты (чтобы не делать много запросов).
const SUBS_CHANNELS_LIMIT = 5
const SUBS_PER_CHANNEL = 3

type Section = { key: string; title: string; data: VideoSummary[] }

export function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const buildSubscriptionsFeed = useCallback(
    async (subs: Subscription[]): Promise<VideoSummary[]> => {
      const picked = subs.slice(0, SUBS_CHANNELS_LIMIT)
      const lists = await Promise.all(
        picked.map(async (s) => {
          try {
            const ch = await getChannel(s.channelId)
            return ch.videos.slice(0, SUBS_PER_CHANNEL)
          } catch {
            return [] as VideoSummary[]
          }
        })
      )
      // Собираем и убираем дубли.
      const seen = new Set<string>()
      const merged: VideoSummary[] = []
      for (const v of lists.flat()) {
        if (!seen.has(v.id)) {
          seen.add(v.id)
          merged.push(v)
        }
      }
      return merged
    },
    []
  )

  const load = useCallback(async () => {
    setError(null)
    try {
      const region = await getRegion()
      const [trendingRes, subs] = await Promise.all([
        getTrending(region, 1, 20),
        getSubscriptions(),
      ])
      const next: Section[] = []
      if (subs.length > 0) {
        const feed = await buildSubscriptionsFeed(subs)
        if (feed.length > 0)
          next.push({ key: "subs", title: "Из ваших подписок", data: feed })
      }
      next.push({
        key: "trending",
        title: "Рекомендации и тренды",
        data: trendingRes.results,
      })
      setSections(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка")
    }
  }, [buildSubscriptionsFeed])

  useFocusEffect(
    useCallback(() => {
      let active = true
      setLoading(true)
      load().finally(() => {
        if (active) setLoading(false)
      })
      return () => {
        active = false
      }
    }, [load])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  const submitSearch = () => {
    navigation.navigate("Results", { query: query.trim() })
  }

  // Раскладываем секции в плоский список для FlatList.
  type Row =
    | { type: "header"; key: string; title: string }
    | { type: "video"; key: string; video: VideoSummary }
  const rows: Row[] = []
  for (const s of sections) {
    rows.push({ type: "header", key: `h-${s.key}`, title: s.title })
    for (const v of s.data)
      rows.push({ type: "video", key: `${s.key}-${v.id}`, video: v })
  }

  const header = (
    <View style={styles.searchRow}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Поиск на YouTube..."
        placeholderTextColor={theme.colors.textSecondary}
        returnKeyType="search"
        onSubmitEditing={submitSearch}
        autoCorrect={false}
      />
      <TouchableOpacity style={styles.searchBtn} onPress={submitSearch}>
        <Text style={styles.searchBtnText}>Найти</Text>
      </TouchableOpacity>
    </View>
  )

  if (loading && sections.length === 0) return <Loading label="Загружаем рекомендации..." />
  if (error && sections.length === 0)
    return (
      <View style={styles.container}>
        {header}
        <ErrorView message={error} onRetry={onRefresh} />
      </View>
    )

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        contentContainerStyle={ { padding: 12 } }
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="Нет рекомендаций"
            subtitle="Потяните вниз, чтобы обновить."
          />
        }
        renderItem={({ item }) =>
          item.type === "header" ? (
            <Text style={styles.sectionTitle}>{item.title}</Text>
          ) : (
            <VideoCard
              video={item.video}
              onPress={() =>
                navigation.navigate("Video", { video: item.video })
              }
            />
          )
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  searchRow: { flexDirection: "row", marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
    marginLeft: 10,
  },
  searchBtnText: { color: "#fff", fontWeight: "700" },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 10,
  },
})
