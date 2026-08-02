import React from 'react';
import { View, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabs from './MainTabs';
import LinkedInScreen from '../screens/LinkedInScreen';
import { UserProvider, useUser } from '../context/UserContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useThemeColors } from '../context/ThemeContext';
import { useColorScheme } from 'react-native';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { hasOnboarded, isLoading: isUserLoading } = useUser();
  const { isAuthenticated, isLoading: isAuthLoading, sessionExpired } = useAuth();
  const colors = useThemeColors();
  const scheme = useColorScheme();

  if (isUserLoading || isAuthLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const initialRouteName = isAuthenticated
    ? hasOnboarded
      ? 'MainTabs'
      : 'Onboarding'
    : sessionExpired
      ? 'Login'
      : 'Landing';

  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          key={isAuthenticated ? `authed-${hasOnboarded}` : 'anon'}
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRouteName}
        >
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="LinkedIn" component={LinkedInScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

const AppNavigator = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <RootNavigator />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppNavigator;
