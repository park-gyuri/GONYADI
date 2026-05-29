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

export const uploadReviewImages = async (formData) => {
  const response = await apiClient('/api/v1/reviews/upload-images', {
    method: 'POST',
    body: formData,
    // FormData일 경우 apiClient 내부에서 Content-Type 처리를 알아서 안하게 됨 (자동 multipart/form-data)
  });
  return response; // { uploaded_urls: [...] }
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

export const fetchTopLikedReviews = async () => {
  return await apiClient('/api/v1/reviews/top-liked', { method: 'GET' });
};

export const likeReview = async (reviewId) => {
  return await apiClient(`/api/v1/reviews/${reviewId}/like`, { method: 'POST' });
};

export const unlikeReview = async (reviewId) => {
  return await apiClient(`/api/v1/reviews/${reviewId}/like`, { method: 'DELETE' });
};

export const fetchMyLikedReviews = async () => {
  return await apiClient('/api/v1/reviews/my-likes', { method: 'GET' });
};
