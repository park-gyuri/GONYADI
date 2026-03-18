// app/review-select-route.tsx
import { Stack } from 'expo-router';
import ReviewSelectRouteScreen from '../../src/screens/ReviewSelectRouteScreen';

export default function ReviewSelectRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ReviewSelectRouteScreen />
    </>
  );
}