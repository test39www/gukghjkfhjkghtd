# iPad YouTube Client (iOS 12.5.8) — учебный MVP

## 1. Что это за проект
Учебный YouTube-клиент для старого iPad на iOS 12.5.8. Приложение (frontend)
отвечает только за интерфейс и воспроизведение, а отдельный backend отдаёт
данные о видео, поиске, каналах и ссылках на воспроизведение через REST API.

Не используется официальный YouTube API. Нет обхода DRM, платного/приватного
контента, авторизации Google и защит YouTube. По умолчанию включён mock-режим.

## 2. Архитектура API
- `GET /api/health` — статус сервера и текущий режим (mock/real).
- `GET /api/search?q=&page=&limit=` — пагинированный поиск.
  Ответ: `{ query, page, limit, total, hasMore, results }`.
- `GET /api/video/:id` — только **метаданные** видео (без streamUrl).
- `GET /api/stream/:id` — **ссылка на воспроизведение** (`{ id, streamUrl, mimeType, note }`).
- `GET /api/channel/:id` — канал с описанием, подписчиками и списком видео.

Источник данных абстрагирован через интерфейс `VideoProvider`
(`MockVideoProvider` по умолчанию, `RealVideoProvider` — заглушка). Переключение
через `DATA_SOURCE=mock|real` без правки routes.

## 3. Почему для iOS 12 нельзя использовать новые версии Expo
- Expo SDK 46 — последняя версия с официальной поддержкой iOS 12.
- SDK 47+ поднял минимальную версию до iOS 13, новые SDK — ещё выше.
- Expo Router стабилизировался только с SDK 47–49, поэтому он несовместим с
  SDK 46. Вместо него используется React Navigation v6.
- Видео проигрывается через expo-av (нативный AVPlayer): на iOS 12 работают
  H.264/AAC mp4 и HLS; VP9/AV1/DASH — нет.

## 4. Зависимости зафиксированы
- Все версии в `package.json` указаны **точно** (без `^` и `~`), чтобы старый
  проект случайно не обновился.
- Не обновляйте Expo выше SDK 46 и React Native выше 0.69.x.
- Не добавляйте библиотеки, требующие iOS 13+.
- Зафиксируйте дерево зависимостей локфайлом:

```bash
cd backend  && npm install   # создаст backend/package-lock.json
cd frontend && npm install   # создаст frontend/package-lock.json
```

> Локфайлы генерируются при первом `npm install` (нужен доступ к npm registry).
> Так как версии уже закреплены точно, результат будет детерминированным.
> После генерации коммитьте оба `package-lock.json` в репозиторий.

## 5. Запуск backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Сервер поднимется на http://localhost:4000. Проверка: `GET /api/health`.

## 6. Запуск frontend (режим разработки)
```bash
cd frontend
npm install
npx expo start
```

> ⚠️ **Современный Expo Go из App Store НЕ подходит для iOS 12.**
> Актуальный Expo Go требует iOS 13+. Для iPad на iOS 12.5.8 нужно либо
> собрать собственный IPA (см. раздел 7), либо найти старую совместимую
> версию Expo Go эпохи SDK 46. На симуляторе/новом устройстве `expo start`
> удобен только для разработки UI.

## 7. Сборка IPA для iOS 12 (пошагово)
```bash
# 1. Backend
cd backend
npm install
npm run dev            # держите запущенным в отдельном терминале

# 2. Frontend: генерация нативного проекта
cd ../frontend
npm install
npx expo prebuild      # создаст папки ios/ и android/

# 3. iOS нативные зависимости
cd ios
pod install
```
Далее в Xcode:
1. Откройте **`.xcworkspace`** (а не `.xcodeproj`).
2. Выставьте **iOS Deployment Target = 12.0**:
   - `ios/Podfile`: `platform :ios, '12.0'` (затем повторно `pod install`);
   - Target → Build Settings → `IPHONEOS_DEPLOYMENT_TARGET = 12.0`.
3. Соберите архив (Product → Archive) и экспортируйте **.ipa**.
   Для jailbreak-устройства подпись не обязательна (ad-hoc/фейковая).

## 8. Установка на jailbroken iPad
1. Соберите `.ipa` (см. раздел 7).
2. Установите **AppSync Unified** из Cydia/Sileo (разрешает неподписанные IPA).
3. Перенесите `.ipa` на iPad и установите через **Filza** или совместимый
   инсталлятор IPA.
4. Запустите приложение и укажите backend URL на вкладке «Настройки».

## 9. HTTP-доступ к локальному backend (iOS ATS)
Приложение ходит на `http://192.168.x.x:4000`, поэтому в `frontend/app.json` для iOS
включён ATS-исключение:
```json
"ios": {
  "infoPlist": {
    "NSAppTransportSecurity": { "NSAllowsArbitraryLoads": true }
  }
}
```
Без этого iOS блокирует не-HTTPS запросы. iPad и компьютер с backend должны
быть в одной сети; используйте IP компьютера, а не localhost.

## 10. Как поменять backend URL в приложении
Вкладка «Настройки» → введите адрес → «Проверить» → «Сохранить».
Адрес валидируется (http:// или https://, без пустого значения, без `/` в конце)
и хранится в AsyncStorage.

## 11. Ограничения
- streamUrl в mock-режиме указывает на публичные тестовые mp4, а не на YouTube.
- iOS 12 не проигрывает VP9/AV1/DASH — только H.264/AAC mp4 и HLS.
- Expo SDK 46 устарел; новые библиотеки ставить нельзя.
- Реальный источник данных нужно подключать самостоятельно и легально.

## 12. Какие версии использовать
- Node.js: 16 или 18 LTS
- npm: 8 или 9
- Expo SDK: 46 (не выше)
- React Native: 0.69.6 (не выше 0.69.x)
- React: 18.0.0
- React Navigation: 6.x (Expo Router НЕ используется)

## 13. Где подключить свой легальный источник данных
Реализуйте `backend/src/services/providers/RealVideoProvider.ts` и запустите с
`DATA_SOURCE=real`. Методы `searchVideos/getVideo/getChannel/getStream` должны
брать данные из вашего легального источника (self-hosted Piped/Invidious,
собственный медиасервер или лицензированный провайдер), отдавая H.264/AAC
mp4 или HLS. Routes менять не нужно.

## 14. Сборка через GitHub Actions (macOS runner)
В репозитории есть готовый workflow `.github/workflows/ios-build.yml`, который
собирает **неподписанный .ipa** на macOS-раннере — именно такой IPA нужен
для jailbroken iPad через AppSync/Filza (сертификаты и секреты НЕ нужны).

### Что делает workflow
1. `runs-on: macos-13` (Intel + Xcode 14.x, совместим с Expo SDK 46 / RN 0.69);
2. выбирает Xcode 14.3.1 и Node 18;
3. `npm install` в `frontend/`;
4. `npx expo prebuild --platform ios --no-install` — генерирует `ios/`;
5. жёстко выставляет iOS Deployment Target = 12.0 в `ios/Podfile`;
6. `pod install`;
7. `scripts/ci-build-ipa.sh` — собирает Release без подписи
   (`CODE_SIGNING_ALLOWED=NO`) и упаковывает `.app` в `Payload/...ipa`;
8. выкладывает готовый IPA как artifact `ipad-youtube-client-ipa`.

### Как запустить
- Автоматически — при push в `main`, если менялись файлы в `frontend/**`.
- Вручную — вкладка **Actions → Build iOS IPA (unsigned) → Run workflow**.
- После сборки скачайте IPA из раздела **Artifacts** и установите на iPad
  через AppSync/Filza (см. раздел 8).

### Важно
- Backend в CI не собирается — его нужно запускать отдельно в локальной сети
  (см. раздел 5); backend URL задаётся в приложении на вкладке «Настройки».
- IPA неподписанный — установка возможна только на jailbroken-устройстве с AppSync.
  Для обычного устройства нужна подпись (Apple Developer), что выходит за рамки
  учебного MVP.
- Папки `ios/` и `android/` намеренно в `.gitignore`: они воссоздаются
  `expo prebuild` на каждой сборке.
