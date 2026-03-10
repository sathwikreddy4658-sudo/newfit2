# Firebase Functions Deployment Guide - IAM Permissions Required

## ✅ What's Already Deployed
- ✅ Firestore rules
- ✅ Storage rules
- ✅ Firestore indexes
- ⏳ Cloud Functions (needs IAM setup)

---

## ⚠️ Issue: Cloud Functions Deployment Requires IAM Permissions

Firebase Functions v2 requires specific IAM roles to be granted to service accounts. You have two options:

---

## Option 1: Quick Fix - Grant Roles via Firebase Console (Recommended)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/project/newfit-35320/settings/iam
2. Or: Firebase Console → Project Settings → Users and Permissions

### Step 2: Grant Required Roles
Make sure your Google account has these roles:
- ✅ **Owner** or **Editor** (to grant IAM permissions)

### Step 3: Enable Required APIs
1. Go to: https://console.cloud.google.com/apis/library?project=newfit-35320
2. Enable these APIs:
   - ✅ Cloud Functions API
   - ✅ Cloud Build API
   - ✅ Artifact Registry API
   - ✅ Eventarc API
   - ✅ Cloud Run API
   - ✅ Pub/Sub API

### Step 4: Run Deployment Again
```powershell
firebase deploy --only "functions"
```

Firebase will automatically configure IAM bindings if you have Owner/Editor permissions.

---

## Option 2: Manual IAM Setup via gcloud CLI

### Prerequisites
1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. After installation, restart PowerShell
3. Authenticate: `gcloud auth login`
4. Set project: `gcloud config set project newfit-35320`

### Grant Required IAM Roles
Run these commands one by one:

```powershell
# 1. Grant Pub/Sub service account token creator role
gcloud projects add-iam-policy-binding newfit-35320 `
  --member=serviceAccount:service-77769867648@gcp-sa-pubsub.iam.gserviceaccount.com `
  --role=roles/iam.serviceAccountTokenCreator

# 2. Grant compute service account Cloud Run invoker role
gcloud projects add-iam-policy-binding newfit-35320 `
  --member=serviceAccount:77769867648-compute@developer.gserviceaccount.com `
  --role=roles/run.invoker

# 3. Grant compute service account Eventarc receiver role
gcloud projects add-iam-policy-binding newfit-35320 `
  --member=serviceAccount:77769867648-compute@developer.gserviceaccount.com `
  --role=roles/eventarc.eventReceiver
```

### Then Deploy Functions
```powershell
firebase deploy --only "functions"
```

---

## Option 3: Deploy Frontend Only (Skip Functions for Now)

If you just want to deploy the performance fixes to your website:

### Build and Deploy Frontend
```powershell
# Build the optimized production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

**Note**: Without Cloud Functions, these features won't work:
- PhonePe payment processing
- Payment status checking
- Telegram order notifications

But the website performance fixes will be live!

---

## ✅ What Was Fixed in Cloud Functions

I updated your Functions code from v1 to v2 API:

### Changes Made:
```diff
- import * as functions from "firebase-functions";
+ import { onRequest } from "firebase-functions/v2/https";
+ import { onDocumentCreated } from "firebase-functions/v2/firestore";

- export const api = functions
-   .runWith({ timeoutSeconds: 60, memory: "256MB" })
-   .https.onRequest(app);
+ export const api = onRequest(
+   { timeoutSeconds: 60, memory: "256MiB", maxInstances: 10 },
+   app
+ );

- export const onNewOrder = functions.firestore
-   .document("orders/{orderId}")
-   .onCreate(async (snap) => {
+ export const onNewOrder = onDocumentCreated(
+   "orders/{orderId}",
+   async (event) => {
+     const snap = event.data;
```

---

## 🚀 Recommended Deployment Strategy

### Scenario 1: I Have Owner/Editor Access
```powershell
# Deploy everything at once
firebase deploy
```
Firebase will auto-configure IAM if you have proper permissions.

### Scenario 2: I Don't Have Owner/Editor Access
```powershell
# Deploy frontend only
npm run build
firebase deploy --only hosting

# Ask project owner to run:
firebase deploy --only "functions"
```

### Scenario 3: I Want to Test Frontend Locally First
```powershell
# Run development server
npm run dev

# Open http://localhost:8080
# Test the performance improvements
```

---

## 🔍 Troubleshooting

### Error: "IAM policy binding failed"
**Solution**: Use Option 1 - Firebase Console method, OR ask project owner to deploy

### Error: "gcloud not found"
**Solution**: 
1. Install: https://cloud.google.com/sdk/docs/install
2. Restart PowerShell after installation
3. Run: `gcloud auth login`

### Error: "Permission denied"
**Solution**: You need Owner or Editor role on the Firebase project

---

## 📊 What Each Component Does

| Component | What It Does | Required For |
|-----------|-------------|--------------|
| **Firestore Rules** ✅ | Controls database access | Everything (DEPLOYED) |
| **Storage Rules** ✅ | Controls file upload access | Image uploads (DEPLOYED) |
| **Cloud Functions** ⏳ | Payment processing & notifications | PhonePe payments (NEEDS IAM) |
| **Hosting** | Serves your website | User-facing site |

---

## 🎯 Next Steps

### To Deploy Everything:
1. Try: `firebase deploy` (if you have Owner/Editor role)
2. If it fails with IAM error, use Option 1 or 2 above
3. If still stuck, deploy frontend only: `npm run build && firebase deploy --only hosting`

### To Test Performance Fixes Locally:
```powershell
npm run dev
# Open http://localhost:8080
# Test button clicks, navigation, checkout
```

---

## ℹ️ Additional Notes

- **Functions v2 Benefits**: Auto-scaling, better performance, simpler syntax
- **IAM Requirements**: One-time setup, won't be needed for future deployments
- **Alternative**: Deploy frontend now, setup Functions later when owner is available

---

**The TypeScript errors are fixed! Functions code is ready to deploy once IAM is configured.**
