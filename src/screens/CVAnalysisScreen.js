import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CVUploadScreen from './CVUploadScreen';
import AnalysisLoadingScreen from './AnalysisLoadingScreen';
import AnalysisResultsScreen from './AnalysisResultsScreen';

const Stack = createNativeStackNavigator();

const CVAnalysisScreen = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CVUpload" component={CVUploadScreen} />
      <Stack.Screen name="AnalysisLoading" component={AnalysisLoadingScreen} />
      <Stack.Screen name="AnalysisResults" component={AnalysisResultsScreen} />
    </Stack.Navigator>
  );
};

export default CVAnalysisScreen;
