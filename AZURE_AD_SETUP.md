# Microsoft Entra ID Configuration

## ✅ Configuration Complete

Your HealthMesh application is now configured with Microsoft Entra ID authentication.

### App Registration Details

- **Application Name**: HealthMesh
- **Application (Client) ID**: `5f575598-453d-4278-8e0f-a31fb9048256`
- **Tenant ID**: `0ba0de08-9840-495b-9ba1-a219de9356b8`
- **Redirect URIs**:
  - Production: `https://healthmesh-dev-app.azurewebsites.net/login`
  - Development: `http://localhost:5000/login`

### Environment Variables Set

**Azure App Service** (Runtime - Backend):
```bash
AZURE_AD_CLIENT_ID=5f575598-453d-4278-8e0f-a31fb9048256
AZURE_AD_TENANT_ID=0ba0de08-9840-495b-9ba1-a219de9356b8
```

**GitHub Actions Workflow** (Build-time - Frontend):
```yaml
VITE_AZURE_AD_CLIENT_ID=5f575598-453d-4278-8e0f-a31fb9048256
VITE_AZURE_AD_TENANT_ID=0ba0de08-9840-495b-9ba1-a219de9356b8
VITE_AZURE_AD_REDIRECT_URI=https://healthmesh-dev-app.azurewebsites.net/login
```

## Database Configuration

**Azure SQL Database**: ✅ Connected
- Server: `healthmeshdevsql23qydhgf.database.windows.net`
- Database: `healthmesh`
- Connection String: Configured in `AZURE_SQL_CONNECTION_STRING`

**Tables Used**:
- `hospitals` - Multi-tenant organizations (keyed by `entra_tenant_id`)
- `users` - Users auto-provisioned from Entra ID (keyed by `entra_oid`)
- `patients` - Patient records (hospital-scoped)
- `clinical_cases` - Case management (hospital-scoped)
- `lab_reports` - Lab test results (hospital-scoped)
- `risk_alerts` - Clinical alerts (hospital-scoped)

## How Authentication Works

1. **User visits app** → Redirected to Microsoft login
2. **Microsoft authenticates** → User signs in with work/school/personal account
3. **Token returned** → Contains claims (oid, tid, email, name)
4. **Backend validates token** → Verifies via Microsoft JWKS
5. **Auto-provisioning**:
   - If new tenant → Create hospital record
   - If new user → Create user record
6. **Session established** → User context attached to all API calls

## Security Features

✅ **Microsoft Entra ID ONLY** - No local passwords
✅ **Multi-tenant** - Each organization isolated by `hospital_id`
✅ **Auto-provisioning** - Users created on first login
✅ **Token validation** - JWT verified via Microsoft JWKS endpoint
✅ **HIPAA compliant** - No hardcoded credentials
✅ **Data isolation** - All queries filtered by `hospital_id`

## Testing Authentication

1. Visit: https://healthmesh-dev-app.azurewebsites.net
2. Click "Sign in with Microsoft"
3. Use any Microsoft account:
   - Personal Microsoft account (outlook.com, hotmail.com, etc.)
   - Work or school account (Azure AD)
4. On first login:
   - Hospital record auto-created
   - User record auto-created
   - Role assigned (default: 'physician')

## Troubleshooting

### "Entra ID not configured" error
- ✅ Fixed - Environment variables now set
- Frontend build includes VITE_AZURE_AD_* variables
- Backend has AZURE_AD_* variables

### "Redirect URI mismatch" error
- ✅ Fixed - Redirect URIs added to app registration
- Both production and localhost URLs registered

### Database connection issues
- ✅ Fixed - Table names corrected (`clinical_cases` not `cases`)
- Connection string verified in Azure App Service
- Firewall rules allow Azure services

### Sign-in fails
- Check App Registration > Authentication > Platform configurations
- Verify redirect URIs match exactly
- Check browser console for MSAL errors

## Next Deployment

When you push to `main` branch:
1. GitHub Actions builds with Entra ID config
2. Frontend gets `VITE_AZURE_AD_*` variables baked in
3. Deploys to Azure with runtime `AZURE_AD_*` variables
4. Authentication works automatically

## Manual Updates (if needed)

### Change Tenant (Single vs Multi-tenant)

```bash
# Multi-tenant (current)
VITE_AZURE_AD_TENANT_ID=common

# Single-tenant (restrict to your org)
VITE_AZURE_AD_TENANT_ID=0ba0de08-9840-495b-9ba1-a219de9356b8
```

### Add New Redirect URI

```bash
az ad app update --id 5f575598-453d-4278-8e0f-a31fb9048256 \
  --web-redirect-uris \
  "https://healthmesh-dev-app.azurewebsites.net/login" \
  "http://localhost:5000/login" \
  "https://your-new-domain.com/login"
```

## Support

For Microsoft Entra ID documentation:
- https://learn.microsoft.com/entra/identity-platform/
- https://learn.microsoft.com/entra/identity-platform/quickstart-register-app

For MSAL.js documentation:
- https://learn.microsoft.com/entra/msal/javascript/

---

## ✅ Authentication Errors Fixed (Dec 26, 2025)

### Error 1: "Cross-origin token redemption" (AADSTS9002326)
**Cause**: App was configured as Web application instead of SPA  
**Fix**: ✅ Converted to Single-Page Application platform
- Moved redirect URIs from Web to SPA configuration
- Disabled implicit grant flow (not needed for SPA)

### Error 2: "User account does not exist in tenant"
**Cause**: App was single-tenant, restricted to one Azure AD organization  
**Fix**: ✅ Enabled multi-tenant + personal accounts
- Changed `signInAudience` to `AzureADandPersonalMicrosoftAccount`
- Set tenant to `common` (supports all Microsoft accounts)
- Enabled access token version 2

### Current Configuration

**App Registration**:
- Platform: ✅ Single-Page Application (SPA)
- Sign-in audience: ✅ Multi-tenant + Personal Microsoft accounts
- Access token version: ✅ 2
- Redirect URIs (SPA):
  - `https://healthmesh-dev-app.azurewebsites.net/login`
  - `http://localhost:5000/login`

**Supported Accounts**:
- ✅ Personal Microsoft accounts (@outlook.com, @hotmail.com, @live.com)
- ✅ Work accounts (any Azure AD organization)
- ✅ School accounts (any Azure AD organization)
- ✅ Multi-tenant isolation (each org gets separate hospital record)

### Test Authentication

1. Clear browser cache/cookies
2. Visit: https://healthmesh-dev-app.azurewebsites.net
3. Click "Sign in with Microsoft"
4. Try with ANY Microsoft account:
   - Personal: yourname@outlook.com
   - Work: yourname@yourcompany.com
   - School: yourname@university.edu

Should work now! 🎉

