import React from "react"
import { Text } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { VideoSummary } from "../types"
import { theme } from "../theme"
import { HomeScreen } from "../screens/HomeScreen"
import { SearchScreen } from "../screens/SearchScreen"
import { ResultsScreen } from "../screens/ResultsScreen"
import { VideoScreen } from "../screens/VideoScreen"
import { VideoInfoScreen } from "../screens/VideoInfoScreen"
import { ChannelScreen } from "../screens/ChannelScreen"
import { FavoritesScreen } from "../screens/FavoritesScreen"
import { HistoryScreen } from "../screens/HistoryScreen"
import { AccountScreen } from "../screens/AccountScreen"
import { SettingsScreen } from "../screens/SettingsScreen"

export type RootStackParamList = {
  Tabs: undefined
  Results: { query: string }
  Video: { video: VideoSummary }
  VideoInfo: { video: VideoSummary }
  Channel: { channelId: string; channelTitle?: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

const headerStyle = { backgroundColor: theme.colors.surface }

// Простые текстовые иконки вкладок (без внешних icon-библиотек).
function tabIcon(symbol: string) {
  return ({ color }: { color: string }) => (
    <Text style={ { fontSize: 18, color } }>{symbol}</Text>
  )
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={ {
        headerStyle,
        headerTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      } }
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={ { title: "Главная", tabBarIcon: tabIcon("⌂") } }
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={ { title: "Поиск", tabBarIcon: tabIcon("⚲") } }
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={ { title: "Избранное", tabBarIcon: tabIcon("★") } }
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={ { title: "История", tabBarIcon: tabIcon("↺") } }
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={ { title: "Аккаунт", tabBarIcon: tabIcon("☺") } }
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={ { title: "Настройки", tabBarIcon: tabIcon("⚙") } }
      />
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={ { headerStyle, headerTintColor: theme.colors.text } }
    >
      <Stack.Screen name="Tabs" component={Tabs} options={ { headerShown: false } } />
      <Stack.Screen name="Results" component={ResultsScreen} options={ { title: "Результаты" } } />
      <Stack.Screen name="Video" component={VideoScreen} options={ { title: "Просмотр" } } />
      <Stack.Screen name="VideoInfo" component={VideoInfoScreen} options={ { title: "О видео" } } />
      <Stack.Screen name="Channel" component={ChannelScreen} options={ { title: "Канал" } } />
    </Stack.Navigator>
  )
}
