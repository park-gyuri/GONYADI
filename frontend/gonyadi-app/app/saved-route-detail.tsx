// app/saved-route-detail.tsx
import { Stack } from 'expo-router';
import SavedRouteDetailScreen from '../src/screens/SavedRouteDetailScreen';

export default function SavedRouteDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SavedRouteDetailScreen />
    </>
  );
}