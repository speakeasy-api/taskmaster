---
title: Authorization Code Flow
---


## Overview


The OAuth Authorization Code flow is the most secure way for web applications
to authenticate users and access their data on their behalf. Unlike the client
credentials flow which authenticates applications, the authorization code flow
authenticates users and allows your application to act on their behalf.

This flow is perfect for:

- Web applications that need to access user data
- Mobile applications with secure backend servers
- Any application that requires user-specific permissions
- Applications that need long-lived access via refresh tokens

This guide will walk you through implementing the Authorization Code flow with
Taskmaster's API, from creating an OAuth application to making authenticated
requests on behalf of users.

## Prerequisites: Creating an OAuth Application

Before you can use the authorization code flow, you need to register your application:

1. **Sign up and log into Taskmaster** at [taskmaster-speakeasyapi.vercel.app](https://taskmaster-speakeasyapi.vercel.app)
2. **Navigate to the Developer page** from your account settings
3. **Create a new OAuth application**:
   - Give it a descriptive name (e.g., "My Task Management App")
   - **Add your redirect URIs** - these are critical for security
   - Example: `https://yourapp.com/auth/callback`
4. **Save your credentials securely**:
   - `client_id`: A public identifier for your application
   - `client_secret`: A private key - treat this like a password!

<blockquote class="blockquote not-prose not-italic preset-filled-surface-50-950 py-4">
  <strong class="text-lg">
    ☝️ Important: 
  </strong>
  <ul class="list-disc pl-6">
    <li>Store your <code>client_secret</code> securely and never expose it in client-side code</li>
    <li>Your redirect URIs must exactly match what you configure in your application</li>
    <li>Use HTTPS redirect URIs in production for security</li>
  </ul>
</blockquote>

## Step 1: Authorization Request

Start the flow by redirecting users to Taskmaster's authorization endpoint:

```bash
GET https://taskmaster-speakeasyapi.vercel.app/oauth2/authorize?
  response_type=code&
  client_id=<YOUR_CLIENT_ID>&
  redirect_uri=<YOUR_APP_REDIRECT_URI>&
  scope=openid+profile+email&
  state=<OPTIONAL_RANDOM_STATE_VALUE>& # Optional
  code_challenge=<OPTIONAL_CODE_CHALLENGE>& # Optional
  code_challenge_method=S256 # Optional
```

**Required Parameters**:

- `response_type`: Must be `code`
- `client_id`: Your OAuth application's client ID
- `redirect_uri`: Must match one of your configured redirect URIs
- `scope`: Requested permissions (space or plus-separated)

**Optional Parameters**:

- `state`: Random value to prevent CSRF attacks
- `code_challenge`: PKCE code challenge (recommended for security)
- `code_challenge_method`: Must be `S256` (required if using PKCE)

**Available Scopes**:

- `openid`: Required for OpenID Connect
- `profile`: Access to user's profile information
- `email`: Access to user's email address

## Step 2: User Authentication and Consent

After redirecting to the authorization endpoint:

1. **User Login**: If not already logged in, the user will be prompted to sign in
2. **Consent**: The user will see your app's requested permissions and can
   approve or deny
3. **Redirect**: Upon approval, the user is redirected back to your `redirect_uri`

The redirect will include the authorization code:

```bash
https://yourapp.com/auth/callback?
  code=<AUTHORIZATION_CODE>&
  state=<OPTIONAL_STATE_VALUE>
```

**Note**: `state` will only be passed along if it was provided when requesting
the authorization code. Always verify that the `state` parameter matches what
you sent to prevent CSRF attacks.

## Step 3: Exchange Code for Tokens

Exchange the authorization code for access tokens by making a POST request to
the token endpoint:

```bash
curl -X POST https://taskmaster-speakeasyapi.vercel.app/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $(echo -n 'your_client_id:your_client_secret' | base64)" \
  -d "grant_type=authorization_code" \
  -d "code=<AUTHORIZATION_CODE>" \
  -d "redirect_uri=https://yourapp.com/auth/callback" \
  -d "code_verifier=<OPTIONAL_CODE_VERIFIER>"
```

**Request Parameters**:

- `grant_type`: Must be `authorization_code`
- `code`: The authorization code from step 2
- `redirect_uri`: Must match the original redirect URI
- `code_verifier`: The original PKCE code verifier (if using PKCE)

### Successful Response

```json
{
  "access_token": "abc123def456...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "scope": "openid profile email"
}
```

- `access_token`: Use this to make API requests
- `token_type`: Always "Bearer"
- `expires_in`: Token lifetime in seconds (3600 = 1 hour)
- `id_token`: JWT containing user information (only if `openid` scope requested)
- `scope`: The actual scopes granted (may be less than requested)

## Step 4: Using Your Access Token

Make authenticated API requests using the access token:

```bash
curl -X GET https://taskmaster-speakeasyapi.vercel.app/api/tasks \
  -H "Authorization: Bearer your_access_token"
```

### Expected Response

```json
[
  {
    "id": "task-123",
    "title": "Review API documentation",
    "description": "Update the authorization code flow docs",
    "status": "todo",
    "project_id": "proj-456",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

## PKCE (Proof Key for Code Exchange)

PKCE is an optional security measure that prevents authorization code
interception attacks. It's highly recommended for all OAuth flows.

### Generating PKCE Parameters

1. **Create a code verifier**: Random string (43-128 characters)

```bash
code_verifier=$(openssl rand -base64 96 | tr -d '/+=' | tr -d '\\n' | head -c 128)
```

2. **Generate code challenge**: SHA256 hash of the verifier, base64url-encoded

```base
code_challenge=$(echo -n "$code_verifier" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '/+' '_-')
```

3. **Use in authorization request**:

   - `code_challenge`: The generated challenge
   - `code_challenge_method`: `S256`

4. **Use verifier in token request**:

   - `code_verifier`: The original verifier string

This returns a new access token.

## Error Handling

### Invalid Authorization Request (400 Bad Request)

```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameter: client_id"
}
```

**Solutions**: Verify all required parameters are included and properly formatted.

### Invalid Client (401 Unauthorized)

```json
{
  "error": "invalid_client",
  "error_description": "Invalid client credentials"
}
```

**Solutions**: Check your client_id and client_secret are correct.

### Invalid Authorization Code (400 Bad Request)

```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code expired"
}
```

**Solutions**: Authorization codes expire after 10 minutes. Start the flow again.

### Invalid Redirect URI (400 Bad Request)

```json
{
  "error": "invalid_request",
  "error_description": "Invalid redirect URI"
}
```

**Solutions**: Ensure the redirect_uri exactly matches one configured in your
OAuth application.

### PKCE Validation Failed (400 Bad Request)

```json
{
  "error": "invalid_grant", 
  "error_description": "Invalid code verifier"
}
```

**Solutions**: Verify your code_verifier matches the code_challenge used in the
authorization request.

## Security Best Practices

1. **Always use HTTPS**: Both for your redirect URIs and API requests
1. **Implement PKCE**: Prevents authorization code interception
1. **Validate state parameter**: Prevents CSRF attacks
1. **Secure token storage**: Store tokens securely, never in localStorage for
   web apps
1. **Validate ID tokens**: If using OpenID Connect, verify JWT signatures
1. **Use appropriate scopes**: Only request permissions your app actually needs
1. **Short-lived access tokens**: The 1-hour expiration is a security feature

## Next Steps

Now that you have user authentication working, you can:

- Build user-specific features using the API
- Implement automatic token refresh for better user experience
- Use ID tokens to display user profile information
- Explore advanced OAuth features like dynamic client registration

For server-to-server communication without user involvement, check out our
[Client Credentials Flow](/docs/auth/client-credentials-flow) documentation.
