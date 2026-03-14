// app/(tabs)/_layout.tsx
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
          backgroundColor: '#D4E5A5', 
          borderTopLeftRadius: 24,    
          borderTopRightRadius: 24,   
          height: 85,                 
          position: 'absolute',       
          borderTopWidth: 0,          
          elevation: 0,               
          paddingBottom: 10,          
          paddingTop: 20,
        },
      }}>
      
      {/* 1. HOME 탭 */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => {
            const isHomeActive = focused || pathname === '/recommend';
            
            return (
              <View style={[styles.tabItem, isHomeActive && styles.tabItemFocused]}>
                <View style={[styles.iconPlaceholder, { backgroundColor: isHomeActive ? '#111' : '#555' }]} />
                <Text style={[styles.tabText, { color: isHomeActive ? '#111' : '#555' }]}>HOME</Text>
              </View>
            );
          },
        }}
      />
      
      {/* 2. ROUTE 탭 */}
      <Tabs.Screen
        name="route"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
              <View style={[styles.iconPlaceholder, { backgroundColor: focused ? '#111' : '#555' }]} />
              <Text style={[styles.tabText, { color: focused ? '#111' : '#555' }]}>ROUTE</Text>
            </View>
          ),
        }}
      />

      {/* 3. REVIEW 탭 */}
      <Tabs.Screen
        name="review"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
              <View style={[styles.iconPlaceholder, { backgroundColor: focused ? '#111' : '#555' }]} />
              <Text style={[styles.tabText, { color: focused ? '#111' : '#555' }]}>REVIEW</Text>
            </View>
          ),
        }}
      />

      {/* 4. MY 탭 */}
      <Tabs.Screen
        name="my"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
              <View style={[styles.iconPlaceholder, { backgroundColor: focused ? '#111' : '#555' }]} />
              <Text style={[styles.tabText, { color: focused ? '#111' : '#555' }]}>MY</Text>
            </View>
          ),
        }}
      />

      {/* 🌟 5. 추천 입력 폼 (버튼은 숨기고 화면만 연결) */}
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
    height: 55,
    borderRadius: 20, 
  },
  tabItemFocused: {
    backgroundColor: '#95AF68', 
  },
  iconPlaceholder: {
    width: 22,
    height: 22,
    marginBottom: 4,
    borderRadius: 4,
  },
  tabText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});