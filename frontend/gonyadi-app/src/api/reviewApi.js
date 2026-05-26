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

export const updateReview = async (reviewId, reviewData) => {
  const response = await apiClient(`/api/v1/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  });
  return response;
};

export const deleteReview = async (reviewId) => {
  const response = await apiClient(`/api/v1/reviews/${reviewId}`, {
    method: 'DELETE',
  });
  return response;
};

export const fetchMyLikedReviews = async () => {
  return await apiClient('/api/v1/reviews/my-likes', { method: 'GET' });
};
