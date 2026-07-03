import React, { useCallback, useEffect, useState } from "react"
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { ResizeMode, Video } from "expo-av"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../navigation"
import { StreamInfo, VideoDetails, VideoSummary } from "../types"
import { getRelated, getStream, getVideo } from "../api/youtube"
import {
  addToHistory,
  isFavorite,
  isSubscribed,
  toggleFavorite,
  toggleSubscription,
} from "../storage"
import { VideoCard } from "../components/VideoCard"
import { Loading } from "../components/Loading"
import { ErrorView } from "../components/ErrorView"
import { theme } from "../theme"
import { formatViews } from "../utils/format"

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, "Video">

export function VideoScreen() {
  const navigation = useNavigation<Nav>()
  const { video: summary } = useRoute<Route>().params

  const [details, setDetails] = useState<VideoDetails | null>(null)
  const [stream, setStream] = useState<StreamInfo | null>(null)
  const [related, setRelated] = useState<VideoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const [fav, setFav] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPlaybackError(null)
    try {
      // 1) Сначала метаданные видео.
      const data = await getVideo(summary.id)
      setDetails(data)
      await addToHistory(summary)
      setFav(await isFavorite(summary.id))
      setSubscribed(await isSubscribed(summary.channelId))

      // 2) Потом отдельно — ссылка на воспроизведение.
      // Ошибка потока не должна ломать экран с метаданными.
      try {
        const s = await getStream(summary.id)
        setStream(s)
        if (!s.streamUrl) setPlaybackError(s.note)
      } catch {
        setStream(null)
        setPlaybackError(
          "Не удалось получить ссылку на воспроизведение с сервера."
        )
      }

      // 3) Похожие видео — необязательно, ошибку молча игнорируем.
      try {
        const r = await getRelated(summary.id, 12)
        setRelated(r.results)
      } catch {
        setRelated([])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }, [summary])

  useEffect(() => {
    load()
  }, [load])

  const onToggleFav = async () => setFav(await toggleFavorite(summary))
  const onToggleSub = async () =>
    setSubscribed(
      await toggleSubscription({
        channelId: summary.channelId,
        channelTitle: summary.channelTitle,
        thumbnail: summary.thumbnail,
      })
    )
  const openChannel = () =>
    navigation.navigate("Channel", {
      channelId: summary.channelId,
      channelTitle: summary.channelTitle,
    })

  if (loading) return <Loading label="Загружаем видео..." />
  if (error || !details)
    return <ErrorView message={error ?? "Нет данных"} onRetry={load} />

  const canPlay = Boolean(stream?.streamUrl) && !playbackError

  const header = (
    <View>
      {canPlay ? (
        <Video
          style={styles.video}
          source={ { uri: stream!.streamUrl as string } }
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          onError={() =>
            setPlaybackError(
              "Не удалось воспроизвести видео. Формат может не поддерживаться на iOS 12 (нужен H.264/AAC mp4 или HLS)."
            )
          }
        />
      ) : (
        <View style={styles.videoFallback}>
          <Text style={styles.fallbackText}>
            {playbackError ??
              "Ссылка на воспроизведение недоступна для этого видео."}
          </Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title}>{details.title}</Text>
        <TouchableOpacity onPress={openChannel}>
          <Text style={styles.channelLink}>{details.channelTitle}</Text>
        </TouchableOpacity>
        <Text style={styles.sub}>{formatViews(details.views)} просмотров</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onToggleFav}>
            <Text style={styles.actionText}>
              {fav ? "★ В избранном" : "☆ В избранное"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, subscribed && styles.actionBtnActive]}
            onPress={onToggleSub}
          >
            <Text
              style={[
                styles.actionText,
                subscribed && styles.actionTextActive,
              ]}
            >
              {subscribed ? "✓ Подписан" : "+ Подписаться"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("VideoInfo", { video: summary })}
          >
            <Text style={styles.actionText}>Информация</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.description} numberOfLines={4}>
          {details.description}
        </Text>

        {related.length > 0 ? (
          <Text style={styles.sectionTitle}>Похожие видео</Text>
        ) : null}
      </View>
    </View>
  )

  return (
    <FlatList
      style={styles.container}
      data={related}
      keyExtractor={(item, i) => `${item.id}-${i}`}
      ListHeaderComponent={header}
      contentContainerStyle={ { paddingHorizontal: 16, paddingBottom: 24 } }
      renderItem={({ item }) => (
        <VideoCard
          video={item}
          onPress={() =>
            navigation.push("Video", { video: item })
          }
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  video: { width: "100%", height: 260, backgroundColor: "#000" },
  videoFallback: {
    width: "100%",
    height: 200,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  fallbackText: { color: theme.colors.danger, textAlign: "center" },
  body: { paddingVertical: 16 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: "700" },
  channelLink: { color: theme.colors.accent, marginTop: 6, fontWeight: "600" },
  sub: { color: theme.colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: "row", marginTop: 14, flexWrap: "wrap" },
  actionBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  actionBtnActive: { backgroundColor: theme.colors.accent },
  actionText: { color: theme.colors.text, fontWeight: "600" },
  actionTextActive: { color: "#fff" },
  description: { color: theme.colors.textSecondary, marginTop: 6, lineHeight: 20 },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 4,
  },
})
