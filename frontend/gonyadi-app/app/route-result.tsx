// app/route-result.tsx
import { Stack } from 'expo-router'; // 🌟 Stack 불러오기 추가!
import RouteResultScreen from '../src/screens/RouteResultScreen';

export default function RouteResultRoute() {
  return (
    <>
      {/* 🌟 엑스포 기본 헤더를 완전히 숨겨버리는 마법의 한 줄! */}
      <Stack.Screen options={{ headerShown: false }} />
      <RouteResultScreen />
    </>
  );
}