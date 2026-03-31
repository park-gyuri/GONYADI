// app/(tabs)/_layout.tsx
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import HomeIcon from '../../src/components/icons/homeIcon';
import RouteIcon from '../../src/components/icons/routeIcon';
import ReviewIcon from '../../src/components/icons/reviewIcon';
import MyIcon from '../../src/components/icons/myIcon';

export default function TabLayout() {
  const pathname = usePathname();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 85,
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
      }}>

      {/* 1. HOME 탭 */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => {
            const isHomeActive = focused || pathname === '/' || pathname === '/recommend';
            return (
              <View style={styles.tabContainer}>
                <View style={styles.iconContainer}>
                  {isHomeActive && <View style={styles.activeBackground} />}
                  <HomeIcon width={24} height={24} />
                </View>
                <Text style={styles.tabText}>HOME</Text>
              </View>
            );
          },
        }}
      />

      {/* 2. ROUTE 탭 */}
      <Tabs.Screen
        name="route"
        options={{
          tabBarIcon: ({ focused }) => {
            const isRouteActive = focused || pathname === '/route' || pathname === '/route-result' || pathname === '/saved-route-detail';
            return (
              <View style={styles.tabContainer}>
                <View style={styles.iconContainer}>
                  {isRouteActive && <View style={styles.activeBackground} />}
                  <RouteIcon width={24} height={24} />
                </View>
                <Text style={styles.tabText}>ROUTE</Text>
              </View>
            );
          },
        }}
      />

      {/* 3. REVIEW 탭 */}
      <Tabs.Screen
        name="review"
        options={{
          tabBarIcon: ({ focused }) => {
            const isReviewActive = focused || pathname === '/review' || pathname === '/review-select-route' || pathname === '/review-write' || pathname === '/review-detail';
            return (
              <View style={styles.tabContainer}>
                <View style={styles.iconContainer}>
                  {isReviewActive && <View style={styles.activeBackground} />}
                  <ReviewIcon width={24} height={24} />
                </View>
                <Text style={styles.tabText}>REVIEW</Text>
              </View>
            );
          },
        }}
      />

      {/* 4. MY 탭 */}
      <Tabs.Screen
        name="my"
        options={{
          tabBarIcon: ({ focused }) => {
            const isMyActive = focused || pathname === '/my' || pathname === '/my-review-history';
            return (
              <View style={styles.tabContainer}>
                <View style={styles.iconContainer}>
                  {isMyActive && <View style={styles.activeBackground} />}
                  <MyIcon width={24} height={24} />
                </View>
                <Text style={styles.tabText}>MY</Text>
              </View>
            );
          },
        }}
      />

      {/* 5. 추천 입력 폼 (버튼은 숨기고 화면만 연결) */}
      <Tabs.Screen
        name="recommend"
        options={{
          href: null,
        }}
      />
      {/* 후기 상세 화면 */}
      <Tabs.Screen
        name="review-detail"
        options={{ href: null, headerShown: false }}
      />

      {/* 후기 경로 선택 화면 */}
      <Tabs.Screen
        name="review-select-route"
        options={{ href: null, headerShown: false }}
      />

      {/* 후기 글쓰기 화면 */}
      <Tabs.Screen
        name="review-write"
        options={{ href: null, headerShown: false }}
      />

      {/* 작성한 후기 내역 화면 (마이페이지에서 이동) */}
      <Tabs.Screen
        name="my-review-history"
        options={{ href: null, headerShown: false }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    width: 65,
  },
  iconContainer: {
    width: 60,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8AD1C2',
    borderRadius: 16,
  },
  tabText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#55515C',
  },
});