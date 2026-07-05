import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import CVAnalysisScreen from '../screens/CVAnalysisScreen';
import InterviewScreen from '../screens/InterviewScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Ana Sayfa') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CV Analizi') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Mülakat') {
            iconName = focused ? 'mic' : 'mic-outline';
          } else if (route.name === 'Geçmiş') {
            iconName = focused ? 'time' : 'time-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Ana Sayfa" component={HomeScreen} />
      <Tab.Screen name="CV Analizi" component={CVAnalysisScreen} />
      <Tab.Screen name="Mülakat" component={InterviewScreen} />
      <Tab.Screen name="Geçmiş" component={HistoryScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;
