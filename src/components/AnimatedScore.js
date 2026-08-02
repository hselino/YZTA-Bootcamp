import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

// 0'dan hedef puana sayarak yükselen skor metni. Skor kartlarında ilk render'da tetiklenir.
const AnimatedScore = ({ value = 0, style, duration = 900, haptic = false }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listenerId = anim.addListener(({ value: v }) => setDisplayValue(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start(() => {
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
    return () => anim.removeListener(listenerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <Text style={style}>{displayValue}</Text>;
};

export default AnimatedScore;
