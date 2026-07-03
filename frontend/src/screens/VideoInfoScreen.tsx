import React, { useEffect, useState } from "react"
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../navigation"
import { VideoDetails } from "../types"
import { getVideo } from "../api/youtube"
import { Loading } from "../components/Loading"
import { ErrorView } from "../components/ErrorView"
import { theme } from "../theme"
import { formatDate, formatViews } from "../utils/format"

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, "VideoInfo">

export function VideoInfoScreen() {
  const navigation = useNavigation<Nav>()
  const { video } = useRoute<Route>().params
  const [details, setDetails] = useState<VideoDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getVideo(video.id)
      .then(setDetails)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
  }, [video.id])

  if (error) return <ErrorView message={error} />
  if (!details) return <Loading />

  return (
    <ScrollView style={styles.container} contentContainerStyle={ { padding: 16 } }>
      <Text style={styles.title}>{details.title}</Text>
      <Row label="Канал" value={details.channelTitle} />
      <Row label="Просмотры" value={`${formatViews(details.views)}`} />
      <Row label="Длительность" value={details.duration} />
      <Row label="Опубликовано" value={formatDate(details.publishedAt)} />

      <TouchableOpacity
        style={styles.channelBtn}
        onPress={() =>
          navigation.navigate("Channel", {
            channelId: video.channelId,
            channelTitle: video.channelTitle,
          })
        }
      >
        <Text style={styles.channelBtnText}>Открыть канал</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Описание</Text>
      <Text style={styles.description}>{details.description}</Text>
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.row}>
      <Text style={styles.rowLabel}>{label}: </Text>
      {value}
    </Text>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: "700", marginBottom: 12 },
  row: { color: theme.colors.text, marginBottom: 8 },
  rowLabel: { color: theme.colors.textSecondary },
  channelBtn: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  channelBtnText: { color: theme.colors.accent, fontWeight: "700" },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  description: { color: theme.colors.textSecondary, lineHeight: 20 },
})
