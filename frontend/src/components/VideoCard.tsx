import React from "react"
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { VideoSummary } from "../types"
import { theme } from "../theme"
import { formatViews } from "../utils/format"

export function VideoCard({
  video,
  onPress,
}: {
  video: VideoSummary
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Image source={ { uri: video.thumbnail } } style={styles.thumb} />
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.sub}>{video.channelTitle}</Text>
        <Text style={styles.sub}>
          {formatViews(video.views)} просмотров · {video.duration}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 160,
    height: 90,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceAlt,
  },
  meta: { flex: 1, marginLeft: 12, justifyContent: "center" },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  sub: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 },
})
