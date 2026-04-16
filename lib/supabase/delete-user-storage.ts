import type { createServiceRoleClient } from "./admin";

type AdminClient = ReturnType<typeof createServiceRoleClient>;

/** Remove all objects under `{prefix}` in the bucket (recursive). */
async function removePrefixRecursive(
  admin: AdminClient,
  bucket: string,
  prefix: string,
): Promise<void> {
  const { data: items, error } = await admin.storage.from(bucket).list(prefix, {
    limit: 1000,
  });
  if (error || !items?.length) return;

  for (const item of items) {
    const fullPath = `${prefix}/${item.name}`;
    const isFile = item.metadata != null;

    if (isFile) {
      await admin.storage.from(bucket).remove([fullPath]);
    } else {
      await removePrefixRecursive(admin, bucket, fullPath);
    }
  }
}

export async function deleteAllStorageForUser(
  admin: AdminClient,
  userId: string,
): Promise<void> {
  await removePrefixRecursive(admin, "business-photos", userId);
  await removePrefixRecursive(admin, "user-avatars", userId);
}
