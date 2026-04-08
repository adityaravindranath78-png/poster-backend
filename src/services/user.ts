import api from './api';
import {UserProfile} from '../types/user';
import {ApiResponse} from '../types/api';

export async function getProfile(): Promise<ApiResponse<UserProfile>> {
  const {data} = await api.get('/user/profile');
  return data;
}

export async function updateProfile(
  updates: Partial<UserProfile>,
): Promise<ApiResponse<UserProfile>> {
  const {data} = await api.put('/user/profile', updates);
  return data;
}

export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
): Promise<{uploadUrl: string; fileUrl: string}> {
  const {data} = await api.post('/upload/presigned-url', {
    filename,
    contentType,
  });
  return data.data;
}

export async function uploadFileToS3(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const file = await fetch(fileUri);
  const blob = await file.blob();
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {'Content-Type': contentType},
    body: blob,
  });
}
