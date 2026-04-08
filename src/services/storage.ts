import {getPresignedUploadUrl, uploadFileToS3} from './user';

export async function uploadImage(
  fileUri: string,
  folder: string,
): Promise<string> {
  const ext = fileUri.split('.').pop() || 'jpg';
  const filename = `${folder}/${Date.now()}.${ext}`;
  const contentType = ext === 'png' ? 'image/png' : 'image/webp';

  const {uploadUrl, fileUrl} = await getPresignedUploadUrl(
    filename,
    contentType,
  );

  await uploadFileToS3(uploadUrl, fileUri, contentType);
  return fileUrl;
}

export async function uploadProfilePhoto(fileUri: string): Promise<string> {
  return uploadImage(fileUri, 'profiles');
}

export async function uploadLogo(fileUri: string): Promise<string> {
  return uploadImage(fileUri, 'logos');
}
