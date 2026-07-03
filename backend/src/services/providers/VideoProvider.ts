import { Channel, SearchResult, StreamInfo, VideoDetails, VideoSummary } from "../../types"

/**
 * Абстракция источника данных о видео.
 * Позволяет подменять реализацию (mock / реальный источник через Invidious)
 * без переписывания routes и сервисов.
 */
export interface VideoProvider {
  searchVideos(
    query: string,
    page: number,
    limit: number
  ): Promise<SearchResult>
  getVideo(id: string): Promise<VideoDetails | null>
  getChannel(id: string): Promise<Channel | null>
  getStream(id: string): Promise<StreamInfo | null>
  /** Лента рекомендаций / тренды (главный экран). */
  getTrending(region: string, page: number, limit: number): Promise<VideoSummary[]>
  /** Похожие видео для конкретного видео. */
  getRelated(id: string, limit: number): Promise<VideoSummary[]>
}
