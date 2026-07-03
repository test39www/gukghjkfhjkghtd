# PROJECT STATUS

## Что исправлено / улучшено (текущая итерация)
1. **iOS HTTP-доступ (ATS).** В `frontend/app.json` добавлен
   `ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads = true` —
   приложение теперь может ходить на локальный backend по http://.
2. **Зафиксированы зависимости.** Убраны `^`/`~`, все версии точные;
   добавлен `engines.node`. Expo остаётся SDK 46, RN — 0.69.6.
3. **Разделены метаданные и поток.** `/api/video/:id` отдаёт только
   метаданные, `streamUrl` переехал в `/api/stream/:id`. VideoScreen
   сначала грузит видео, потом отдельно getStream(id); ошибки потока
   и неподдерживаемый формат показываются без краша.
4. **Абстракция источника данных.** Добавлен интерфейс `VideoProvider`,
   реализации `MockVideoProvider` и `RealVideoProvider` (заглушка).
   Переключение через `DATA_SOURCE` без правки routes.
5. **Пагинация поиска.** `/api/search` принимает `page` и `limit`,
   ответ: `{ query, page, limit, total, hasMore, results }`. На frontend —
   кнопка «Загрузить ещё».
6. **Экран канала.** Добавлен тип `Channel`, `getChannel(id)`, `ChannelScreen`
   (название, описание, подписчики, список видео), кнопки открытия
   канала в VideoScreen и VideoInfoScreen, маршрут `Channel` в навигации.
7. **Валидация backend URL.** В SettingsScreen: не сохраняет пустой URL,
   требует http:// или https://, убирает `/` в конце, показывает понятную ошибку.
8. **README** обновлён: точные шаги prebuild → pod install → Xcode → IPA →
   AppSync/Filza, предупреждение про Expo Go и iOS 12.

## Какие файлы изменены / добавлены
**Backend**
- изменён: `src/types/index.ts` (VideoDetails без streamUrl, добавлен SearchResult)
- изменён: `src/services/youtubeService.ts` (теперь фасад над провайдером)
- изменён: `src/routes/index.ts` (page/limit в /search)
- изменён: `package.json` (точные версии, engines)
- добавлено: `src/services/providers/VideoProvider.ts`
- добавлено: `src/services/providers/MockVideoProvider.ts`
- добавлено: `src/services/providers/RealVideoProvider.ts`

**Frontend**
- изменён: `app.json` (ATS)
- изменён: `package.json` (точные версии, engines)
- изменён: `src/types/index.ts` (Channel, SearchResponse, VideoDetails без streamUrl)
- изменён: `src/api/youtube.ts` (getStream/getChannel, page/limit)
- изменён: `src/screens/VideoScreen.tsx` (getVideo + getStream, кнопка канала)
- изменён: `src/screens/VideoInfoScreen.tsx` (кнопка канала)
- изменён: `src/screens/ResultsScreen.tsx` (пагинация + «Загрузить ещё»)
- изменён: `src/screens/SettingsScreen.tsx` (валидация URL)
- изменён: `src/navigation/index.tsx` (маршрут Channel)
- добавлено: `src/screens/ChannelScreen.tsx`

**Корень**
- изменён: `README.md`, `PROJECT_STATUS.md`

## Что теперь работает
- Backend: mock-данные, пагинация поиска, отдельные эндпоинты video/stream/channel.
- Frontend: поиск с кнопкой «Загрузить ещё», просмотр видео с раздельной
  загрузкой потока, экран канала, избранное, история, настройки с валидацией.
- Корректная обработка ошибок сети и воспроизведения.

## Что ещё не реализовано
- Реальный легальный источник данных (RealVideoProvider — заглушка).
- Автотесты.
- Полноценная сборка .ipa под iOS 12 (требует macOS + Xcode).
- Кэш/инвалидация истории и избранного сверх базового лимита.

## Проверки (инварианты)
- Expo Router НЕ используется (только React Navigation v6).
- Нет библиотек, требующих iOS 13+.
- Официальный YouTube API / обход DRM НЕ используются.

## Этап MVP: ЗАВЕРШЁН + ДОРАБОТАН ✅
Следующий этап: подключение реального легального источника через RealVideoProvider.

---

## Итерация 2: Подготовка frontend к сборке через GitHub Actions (macOS runner)

### Что добавлено
- **`.github/workflows/ios-build.yml`** — CI-workflow на `macos-13`:
  Xcode 14.3.1 + Node 18 → `npm install` → `expo prebuild` → фиксация
  iOS target 12.0 → `pod install` → сборка неподписанного IPA → upload artifact.
  Запуск: push в main (при изменении frontend/**) или вручную (workflow_dispatch).
- **`frontend/scripts/ci-build-ipa.sh`** — скрипт сборки: автоопределение
  workspace/scheme, `xcodebuild` без подписи (`CODE_SIGNING_ALLOWED=NO`),
  упаковка `.app` в `Payload/...ipa`.

### Что изменено
- **`.gitignore`** — добавлены `build/` и `*.ipa` (артефакты CI).
- **`README.md`** — раздел 14 «Сборка через GitHub Actions (macOS runner)».

### Почему неподписанный IPA
Целевое устройство — jailbroken iPad с AppSync, который ставит неподписанные
IPA. Это убирает необходимость в Apple Developer сертификатах и GitHub-секретах.

### Ограничения
- Сборку нельзя проверить в текущей offline-среде (нет macOS/Xcode);
  workflow и скрипт проверены на валидность YAML и синтаксис bash.
- Неподписанный IPA ставится только на jailbroken-устройство.
