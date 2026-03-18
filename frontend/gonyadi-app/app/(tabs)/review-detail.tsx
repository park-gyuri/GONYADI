// app/review-detail.tsx
import { Stack } from 'expo-router';
import ReviewDetailScreen from '../../src/screens/ReviewDetailScreen';

export default function ReviewDetailRoute() {
  return (
    <>
      {/* 여기서도 엑스포 기본 헤더는 깔끔하게 숨깁니다! */}
      <Stack.Screen options={{ headerShown: false }} />
      <ReviewDetailScreen />
    </>
  );
}