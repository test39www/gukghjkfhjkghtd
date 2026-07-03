import { Channel, SearchResult, StreamInfo, VideoDetails } from "../../types"

/**
 * Абстракция источника данных о видео.
 * Позволяет подменять реализацию (mock / реальный легальный источник)
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
}
