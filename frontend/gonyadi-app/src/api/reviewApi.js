import { apiClient } from './apiClient';

export const fetchReviews = async () => {
  const response = await apiClient('/api/v1/reviews', { method: 'GET' });
  return response;
};

export const fetchReviewById = async (reviewId) => {
  const response = await apiClient(`/api/v1/reviews/${reviewId}`, { method: 'GET' });
  return response;
};

export const createReview = async (reviewData) => {
  const response = await apiClient('/api/v1/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
  return response;
};

export const likeReview = async (reviewId) => {
  return await apiClient(`/api/v1/reviews/${reviewId}/like`, { method: 'POST' });
};

export const unlikeReview = async (reviewId) => {
  return await apiClient(`/api/v1/reviews/${reviewId}/like`, { method: 'DELETE' });
};

export const fetchTopLikedReviews = async () => {
  return await apiClient('/api/v1/reviews/top-liked', { method: 'GET' });
};
