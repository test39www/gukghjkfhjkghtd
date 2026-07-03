import React, { useCallback, useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../navigation"
import { Channel } from "../types"
import { getChannel } from "../api/youtube"
import { isSubscribed, toggleSubscription } from "../storage"
import { VideoCard } from "../components/VideoCard"
import { Loading } from "../components/Loading"
import { ErrorView } from "../components/ErrorView"
import { EmptyState } from "../components/EmptyState"
import { theme } from "../theme"
import { formatViews } from "../utils/format"

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, "Channel">

export function ChannelScreen() {
  const navigation = useNavigation<Nav>()
  const { channelId } = useRoute<Route>().params

  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const ch = await getChannel(channelId)
      setChannel(ch)
      setSubscribed(await isSubscribed(ch.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    load()
  }, [load])

  const onToggleSub = async () => {
    if (!channel) return
    setSubscribed(
      await toggleSubscription({
        channelId: channel.id,
        channelTitle: channel.title,
        thumbnail: channel.thumbnail,
      })
    )
  }

  if (loading) return <Loading label="Загружаем канал..." />
  if (error || !channel)
    return <ErrorView message={error ?? "Канал не найден"} onRetry={load} />

  return (
    <View style={styles.container}>
      <FlatList
        data={channel.videos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={ { padding: 12 } }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{channel.title}</Text>
            <Text style={styles.subs}>
              {formatViews(channel.subscribers)} подписчиков
            </Text>
            <TouchableOpacity
              style={[styles.subBtn, subscribed && styles.subBtnActive]}
              onPress={onToggleSub}
            >
              <Text
                style={[
                  styles.subBtnText,
                  subscribed && styles.subBtnTextActive,
                ]}
              >
                {subscribed ? "✓ Вы подписаны" : "+ Подписаться"}
              </Text>
            </TouchableOpacity>
            {channel.description ? (
              <Text style={styles.description}>{channel.description}</Text>
            ) : null}
            <Text style={styles.sectionTitle}>Видео</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Нет видео"
            subtitle="На этом канале пока нет видео."
          />
        }
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={() => navigation.push("Video", { video: item })}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingBottom: 8 },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: "700" },
  subs: { color: theme.colors.textSecondary, marginTop: 6 },
  subBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subBtnActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  subBtnText: { color: theme.colors.text, fontWeight: "700" },
  subBtnTextActive: { color: "#fff" },
  description: { color: theme.colors.textSecondary, marginTop: 12, lineHeight: 20 },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 4,
  },
})
