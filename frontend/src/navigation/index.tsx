import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { VideoSummary } from "../types"
import { theme } from "../theme"
import { SearchScreen } from "../screens/SearchScreen"
import { ResultsScreen } from "../screens/ResultsScreen"
import { VideoScreen } from "../screens/VideoScreen"
import { VideoInfoScreen } from "../screens/VideoInfoScreen"
import { ChannelScreen } from "../screens/ChannelScreen"
import { FavoritesScreen } from "../screens/FavoritesScreen"
import { HistoryScreen } from "../screens/HistoryScreen"
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

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle,
        headerTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen name="Search" component={SearchScreen} options={ { title: "Поиск" } } />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={ { title: "Избранное" } } />
      <Tab.Screen name="History" component={HistoryScreen} options={ { title: "История" } } />
      <Tab.Screen name="Settings" component={SettingsScreen} options={ { title: "Настройки" } } />
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
