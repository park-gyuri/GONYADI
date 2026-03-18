// app/review-write.tsx
import { Stack } from 'expo-router';
import ReviewWriteScreen from '../../src/screens/ReviewWriteScreen';

export default function ReviewWriteRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ReviewWriteScreen />
    </>
  );
}