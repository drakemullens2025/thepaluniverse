import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="cringe"
        options={{
          title: 'Cringe Pal',
          tabBarIcon: ({ size, color }) => (
            <Text style={{ fontSize: size, color }}>⚡</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="roast"
        options={{
          title: 'Roasta Pal',
          tabBarIcon: ({ size, color }) => (
            <Text style={{ fontSize: size, color }}>💬</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: 'Study Pal',
          tabBarIcon: ({ size, color }) => (
            <Text style={{ fontSize: size, color }}>🎓</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Note Pal',
          tabBarIcon: ({ size, color }) => (
            <Text style={{ fontSize: size, color }}>📝</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          title: 'Homework Pal',
          tabBarIcon: ({ size, color }) => (
            <Text style={{ fontSize: size, color }}>📚</Text>
          ),
        }}
      />
    </Tabs>
  );
}