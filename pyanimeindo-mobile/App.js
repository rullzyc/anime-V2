import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ScreenOrientation from 'expo-screen-orientation';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import DetailScreen from './src/screens/DetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WatchScreen from './src/screens/WatchScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#F59E0B',
    background: '#000000',
    card: '#0D0D0D',
    text: '#FFFFFF',
    border: '#1A1A1A',
  },
};

const TAB_ICONS = {
  Beranda:  { active: '⊞', inactive: '⊟' },
  Jadwal:   { active: '◉', inactive: '◎' },
  Profil:   { active: '●', inactive: '○' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#444',
        tabBarStyle: {
          backgroundColor: '#0D0D0D',
          borderTopWidth: 1,
          borderTopColor: '#1A1A1A',
          paddingBottom: 10,
          paddingTop: 8,
          height: 68,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        headerShown: false,
        tabBarIcon: ({ color, focused }) => {
          const icons = TAB_ICONS[route.name] || { active: '●', inactive: '○' };
          return <Text style={{ fontSize: 22, color }}>{focused ? icons.active : icons.inactive}</Text>;
        },
      })}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Jadwal" component={ScheduleScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  return (
    <NavigationContainer theme={AppTheme}>
      <StatusBar style="light" backgroundColor="#000" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0D0D0D',
          },
          headerTintColor: '#F59E0B',
          headerTitleStyle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={({ route }) => ({
            title: route.params?.title || 'Detail',
            headerStyle: { backgroundColor: '#000' },
          })}
        />
        <Stack.Screen
          name="Watch"
          component={WatchScreen}
          options={({ route }) => ({
            title: route.params?.title || 'Tonton',
            headerStyle: { backgroundColor: '#000' },
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
