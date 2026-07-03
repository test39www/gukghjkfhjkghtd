import { Channel, SearchResult, StreamInfo, VideoDetails } from "../types"
import { MockVideoProvider } from "./providers/MockVideoProvider"
import { RealVideoProvider } from "./providers/RealVideoProvider"
import { VideoProvider } from "./providers/VideoProvider"

const DATA_SOURCE = process.env.DATA_SOURCE ?? "mock"

// Выбор источника данных без переписывания routes.
function createProvider(): VideoProvider {
  return DATA_SOURCE === "real"
    ? new RealVideoProvider()
    : new MockVideoProvider()
}

export const provider: VideoProvider = createProvider()

// Тонкий фасад: routes продолжают вызывать эти функции как раньше.
export const searchVideos = (
  query: string,
  page: number,
  limit: number
): Promise<SearchResult> => provider.searchVideos(query, page, limit)

export const getVideo = (id: string): Promise<VideoDetails | null> =>
  provider.getVideo(id)

export const getChannel = (id: string): Promise<Channel | null> =>
  provider.getChannel(id)

export const getStream = (id: string): Promise<StreamInfo | null> =>
  provider.getStream(id)
