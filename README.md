This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Delavaries section (image + notes with 24h auto-delete)

This project includes a Delavaries page at `/delavaries` where you can upload an image and add notes. Images are uploaded to Cloudinary; the URL and notes are stored in Firestore. Entries are automatically deleted after 24 hours via a cleanup endpoint.

Setup required:

1. Create a Cloudinary unsigned upload preset (Settings → Upload → Upload presets):

   - Mode: unsigned
   - Allowed formats: images
   - (Optional) Folder: `delavaries`

2. Configure environment variables (`.env.local`):

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. Automatic deletion after 24h:
   - Deploy and schedule a cron to call `GET /api/cleanup-delavaries` (e.g., Vercel → Project Settings → Cron Jobs). Hourly is sufficient.
   - Locally, you can run it manually in PowerShell:

```powershell
Invoke-WebRequest http://localhost:3000/api/cleanup-delavaries -UseBasicParsing | Select-Object -ExpandProperty Content
```

Notes:

- For Firebase login on phones over LAN, add your LAN IP (e.g., 192.168.x.x) to Firebase Auth → Authorized domains.
- To access the dev server from your phone: `npm run dev` (binds to 0.0.0.0) and open `http://<your_pc_ip>:3000` on your phone.
