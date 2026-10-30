import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';

/** Lightweight, dependency-free skeleton. Stops animation when unmounted. */
export default function ImageSkeleton({palette, label, compact = false}) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, {toValue: 0.75, duration: 750, useNativeDriver: true}),
      Animated.timing(opacity, {toValue: 0.35, duration: 750, useNativeDriver: true}),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.overlay}>
    <Animated.View style={[styles.shimmer, {backgroundColor: palette?.muted || '#9CA3AF', opacity}]} />
    <View style={[styles.line, {width: compact ? '48%' : '62%', backgroundColor: palette?.surface || '#FFFFFF'}]} />
    {!compact && <View style={[styles.line, {width: '38%', backgroundColor: palette?.surface || '#FFFFFF'}]} />}
  </View>;
}
const styles = StyleSheet.create({
  overlay: {...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 10, overflow: 'hidden'},
  shimmer: {...StyleSheet.absoluteFillObject},
  line: {height: 10, borderRadius: 10, opacity: 0.45},
});
