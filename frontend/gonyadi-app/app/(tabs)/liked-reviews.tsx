import { Stack } from 'expo-router';
import LikedReviewsScreen from '../../src/screens/LikedReviewsScreen';

export default function LikedReviewsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LikedReviewsScreen />
    </>
  );
}
