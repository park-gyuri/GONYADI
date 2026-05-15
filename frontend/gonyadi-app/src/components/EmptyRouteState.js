import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * EmptyRouteState
 * 대중교통 경로를 찾을 수 없을 때 지도/카드 대신 표시하는 빈 상태 UI
 */
const EmptyRouteState = ({ message, onRetry }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>😅</Text>
      <Text style={styles.title}>경로를 찾을 수 없어요</Text>
      <Text style={styles.message}>
        {message || '대중교통 경로를 찾을 수 없습니다.\n거리가 멀거나 운행 노선이 없을 수 있습니다.'}
      </Text>
      <Text style={styles.hint}>출발지나 도착지를 변경해보세요.</Text>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => router.back()}
        >
          <Text style={styles.btnTextSecondary}>← 돌아가기</Text>
        </TouchableOpacity>
        {onRetry && (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onRetry}>
            <Text style={styles.btnTextPrimary}>다시 검색하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  hint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  btnPrimary: {
    backgroundColor: '#43B0AB',
  },
  btnSecondary: {
    backgroundColor: '#EEE',
  },
  btnTextPrimary: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  btnTextSecondary: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default EmptyRouteState;
