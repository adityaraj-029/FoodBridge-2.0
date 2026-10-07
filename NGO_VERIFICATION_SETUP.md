# NGO Verification Module

FoodBridge now supports admin-based NGO verification.

## Flow

1. An NGO signs up and submits its mandatory NGO DARPAN ID and a PDF/image registration proof from the device.
2. The NGO is stored with `verificationStatus: pending`.
3. An admin opens the Admin Dashboard and checks the proof.
4. The admin clicks **Verify** or **Reject**.
5. Only verified NGOs can accept, reject, assign or view donation requests.
6. Verified NGOs are available through `GET /api/ngos/verified`.

## New API routes

- `/admin-login` – separate admin login page
- `GET /api/ngos/pending` – admin only
- `GET /api/ngos/verified` – authenticated users
- `GET /api/ngos/mine` – current NGO status
- `PUT /api/ngos/:id/approve` – admin only
- `PUT /api/ngos/:id/reject` – admin only
- `PUT /api/ngos/:id/suspend` – admin only

## Security note

The original `.env` file is deliberately not included in the updated ZIP. Copy the values into local `.env` files yourself. Never commit secret keys, database credentials or email passwords.

## Testing

1. Register a new NGO.
2. Confirm that the NGO dashboard shows **pending**.
3. Log in as an admin.
4. Open the pending NGO list and open the proof URL.
5. Click **Verify**.
6. Confirm that the NGO can now manage donations.
7. Test **Reject** with a reason and confirm that the NGO cannot manage donations.

## Single admin setup

Only `foodbridgeadmin@gmail.com` can use the admin APIs. The password is not stored in the source code; create this email/password account in Firebase Authentication. For the local demo, set the password there to the password you choose. Then copy the Firebase UID and run this once from the `server` folder:

```bash
node scripts/ensureAdmin.js YOUR_FIREBASE_ADMIN_UID
```

The admin page is `/admin-login`. Do not put the admin password in GitHub, screenshots or the ZIP file.

## Volunteer verification

Volunteers must upload a PDF/image ID proof during signup. They remain pending until the admin approves them. NGOs only see verified volunteers for assignment. The admin dashboard shows volunteer phone, email, status and the uploaded proof.
