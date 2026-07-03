import { Channel, SearchResult, StreamInfo, VideoDetails } from "../../types"
import { notImplemented } from "../../utils/errors"
import { VideoProvider } from "./VideoProvider"

/**
 * Заглушка реального источника данных.
 *
 * ВАЖНО: официальный YouTube API, обход DRM, платного/приватного контента и
 * авторизации Google здесь НЕ реализуются. Когда понадобятся реальные данные,
 * реализуйте методы через свой ЛЕГАЛЬНЫЙ источник (self-hosted Piped/Invidious,
 * собственный медиасервер или лицензированный провайдер), отдающий H.264/AAC
 * mp4 или HLS. Роуты и сервисы менять не нужно — достаточно этого класса.
 */
export class RealVideoProvider implements VideoProvider {
  private notReady(): never {
    throw notImplemented(
      "Реальный источник данных не подключён. Установите DATA_SOURCE=mock или реализуйте RealVideoProvider через легальный источник (Piped/Invidious/собственный медиасервер)."
    )
  }

  async searchVideos(
    _query: string,
    _page: number,
    _limit: number
  ): Promise<SearchResult> {
    return this.notReady()
  }

  async getVideo(_id: string): Promise<VideoDetails | null> {
    return this.notReady()
  }

  async getChannel(_id: string): Promise<Channel | null> {
    return this.notReady()
  }

  async getStream(_id: string): Promise<StreamInfo | null> {
    return this.notReady()
  }
}
