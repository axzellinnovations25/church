# Image storage

Website images are stored in the private Supabase Storage bucket `cathedral-images` in project `pxfoldhgjbmpdeemwqqd`. The browser requests images through the Laravel backend, which serves only allowlisted site assets and images permitted by each content route.

## Backend configuration

Set these variables on the Render backend service and redeploy:

```text
SUPABASE_STORAGE_URL=https://pxfoldhgjbmpdeemwqqd.supabase.co
SUPABASE_STORAGE_BUCKET=cathedral-images
SUPABASE_STORAGE_SERVICE_KEY=<Supabase service_role key>
```

The service key must only be set on the backend. Do not put it in `Frontend/.env`, commit it, or use the personal access token as a runtime credential. `render.yaml` declares the first two values and leaves the secret for Render to sync securely.

New gallery, news, event, and parish council images are uploaded to the bucket. Old local image paths are checked in the bucket first, with a local file fallback. Newsletter PDFs continue to use the existing file storage.

The frontend's site image URLs now point at `/api/v1/site-images/{path}` on the backend. The allowlist is in `backend/config/site_images.php`; add a path there when adding a new static site photo, and upload the matching object under `site/` in the bucket.

The original image files remain in the repository as a recovery source until the new deployment is confirmed. The live database currently has one gallery record whose uploaded file is absent from this workspace and the live backend; its original image must be reuploaded through the admin gallery if needed.
