import { adminFetch, IS_ADMIN_MOCK, AdminApiError } from './client';
import { demoAdapter } from './mock/adapter';

export function validateImageFile(file: File): string | null {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    return 'Only JPG, PNG, WebP or GIF images are allowed.';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'Image must be under 5 MB in size.';
  }
  return null;
}

export const uploadsApi = {
  upload: async (file: File): Promise<{ url: string }> => {
    const error = validateImageFile(file);
    if (error) {
      throw new AdminApiError(error, 400);
    }

    if (IS_ADMIN_MOCK) {
      return demoAdapter.uploadFile(file);
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/uploads', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    });

    if (!res.ok) {
      throw new AdminApiError('Failed to upload image.', res.status);
    }

    return res.json();
  },
};
