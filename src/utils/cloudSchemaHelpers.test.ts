import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUploadSuccessToast,
  isMissingCloudSchemaError,
} from './cloudSchemaHelpers';

test('isMissingCloudSchemaError detects PostgREST missing table/function codes and messages', () => {
  assert.equal(
    isMissingCloudSchemaError({
      code: 'PGRST205',
      message: "Could not find the table 'public.photo_collections' in the schema cache",
    }),
    true
  );
  assert.equal(
    isMissingCloudSchemaError({
      code: 'PGRST202',
      message: 'Could not find the function public.get_memory_comments without parameters in the schema cache',
    }),
    true
  );
  assert.equal(
    isMissingCloudSchemaError({
      code: '42P01',
      message: 'relation "public.yearbook_picks" does not exist',
    }),
    true
  );
  assert.equal(
    isMissingCloudSchemaError({
      status: 404,
      message: '',
    }),
    true
  );
});

test('isMissingCloudSchemaError returns false for RLS, auth, or network errors', () => {
  assert.equal(
    isMissingCloudSchemaError({
      code: '42501',
      status: 403,
      message: 'new row violates row-level security policy for table "photos"',
    }),
    false
  );
  assert.equal(
    isMissingCloudSchemaError({
      status: 401,
      message: 'Invalid API key',
    }),
    false
  );
  assert.equal(
    isMissingCloudSchemaError(new Error('Failed to fetch')),
    false
  );
  assert.equal(isMissingCloudSchemaError(null), false);
});

test('buildUploadSuccessToast confirms automatic saving for shared cloud and vault modes', () => {
  const cloudMsg = buildUploadSuccessToast({
    addedCount: 3,
    skippedDup: 0,
    isSharedCloud: true,
  });
  assert.match(cloudMsg, /tự động lưu/i);
  assert.match(cloudMsg, /3 ảnh/);
  assert.match(cloudMsg, /xem được ngay/);

  const cloudDupMsg = buildUploadSuccessToast({
    addedCount: 2,
    skippedDup: 1,
    isSharedCloud: true,
  });
  assert.match(cloudDupMsg, /bỏ qua 1 ảnh trùng/);

  const localMsg = buildUploadSuccessToast({
    addedCount: 1,
    skippedDup: 0,
    isSharedCloud: false,
  });
  assert.match(localMsg, /tự động lưu/i);
  assert.match(localMsg, /1 khung hình/);
});
