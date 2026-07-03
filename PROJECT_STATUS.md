# PROJECT STATUS

## Итерация 3: Рекомендации, реальный поиск, аккаунт, настройки ✅

Эта итерация закрывает четыре задачи: **рекомендации**, **рабочий поиск**,
**вход в аккаунт** и **доработка настроек**.

### 1. Рекомендации (главный экран)
- Новый `HomeScreen` — лента трендов по региону + секция «Из ваших подписок».
- Pull-to-refresh, поисковая строка сверху.
- Backend: `GET /api/trending` + `getTrending` в обоих провайдерах.
- Backend: `GET /api/related/:id` + `getRelated`; похожие видео на экране видео.

### 2. Рабочий поиск (реальные данные)
- Полностью реализован `RealVideoProvider` поверх Invidious (подход youthub):
  поиск, видео, канал, поток, тренды, похожие — без официального YouTube API.
- Мульти-инстанс с fallback и таймаутом; выбор mp4 H.264/AAC (itag 22→18) для iOS 12.
- Поиск работает как в mock, так и в real режиме; пагинация, лимит по умолчанию 10.

### 3. Вход в аккаунт (локальный)
- `AuthContext` + `useAuth`, хранилище аккаунтов в AsyncStorage (хеш пароля djb2).
- `AccountScreen`: регистрация/вход/выход, профиль со статистикой.
- Данные (история/избранное/подписки) намеспейсятся по аккаунту; гостевой режим.
- Без Google/сервера и без передачи данных наружу.

### 4. Доработаны настройки
- Backend URL (проверка через /health с показом режима/региона, сброс).
- Регион трендов (сохраняется, влияет на главный экран).
- Очистка истории/избранного/подписок с подтверждением.
- Блок «О приложении» (версия, платформа, стек, источник данных).

### Навигация
Вкладки: **Главная** (рекомендации), **Поиск**, **Избранное**, **История**,
**Аккаунт**, **Настройки**. App обёрнут в `AuthProvider`.

### Файлы этой итерации
**Backend**
- изменён: `src/services/providers/VideoProvider.ts` (+getTrending/+getRelated)
- изменён: `src/services/providers/MockVideoProvider.ts` (+getTrending/+getRelated)
- переписан: `src/services/providers/RealVideoProvider.ts` (Invidious)
- изменён: `src/services/youtubeService.ts` (фасад +getTrending/+getRelated)
- изменён: `src/routes/index.ts` (+/trending, +/related, region в /health)
- добавлен: `.env.example`

**Frontend**
- добавлен: `src/screens/HomeScreen.tsx` (рекомендации)
- добавлен: `src/screens/AccountScreen.tsx` (вход/регистрация/профиль)
- добавлен: `src/context/AuthContext.tsx`
- переписан: `src/storage/index.ts` (аккаунты, подписки, регион, namespacing)
- переписан: `src/screens/SettingsScreen.tsx` (регион, очистка, about)
- изменён: `src/screens/VideoScreen.tsx` (похожие видео + подписка)
- изменён: `src/screens/ChannelScreen.tsx` (кнопка подписки)
- изменён: `src/screens/ResultsScreen.tsx` (лимит 10, push)
- изменён: `src/navigation/index.tsx` (вкладки Home и Account)
- изменён: `src/api/youtube.ts` (getTrending, getRelated, region)
- изменён: `src/types/index.ts` (Subscription, Account)
- изменён: `App.tsx` (AuthProvider)

**Корень**
- изменён: `README.md`, `PROJECT_STATUS.md`

### Проверки (инварианты)
- Expo Router НЕ используется (только React Navigation v6, т.к. несовместим с SDK 46).
- Нет библиотек, требующих iOS 13+.
- Официальный YouTube API / обход DRM НЕ используются.
- Все .ts/.tsx проходят синтаксическую проверку (transpileModule).

### Ограничения
- Полная проверка типов (tsc) требует `npm install` (сеть недоступна в текущей среде).
- Стабильность real-режима зависит от доступности Invidious-инстансов; лучше свой инстанс.
- Пароль аккаунта — простой хеш (не криптостойкий); это локальный профиль, не безопасность.

---

## Итерации 1–2 (ранее)
Базовый MVP (mock, пагинация, разделение video/stream, канал, ATS, точные
версии зависимостей) и подготовка CI (GitHub Actions, macOS, неподписанный IPA).
См. историю в README (разделы 7–14).
