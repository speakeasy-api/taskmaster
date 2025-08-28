---
title: Client Credentials Flow
---

## Overview

The OAuth Client Credentials flow is a way for applications to authenticate
directly with an API without involving a user. Think of it as a "service
account" - your application gets its own credentials and can make API calls on
its own behalf.

This is perfect for:

- Server-to-server communication
- Scheduled tasks or background jobs
- Applications that manage their own data (not user-specific data)

This guide will walk you through setting up the Client Credentials flow with
Taskmaster's API, from creating an OAuth application to making authenticated
requests.

## Prerequisites: Creating an OAuth Application

Before you can get an access token, you need to register your application in
Taskmaster:

1. **Sign up and log into Taskmaster** at [taskmaster-speakeasyapi.vercel.app](https://taskmaster-speakeasyapi.vercel.app)
2. **Navigate to the Developer page** from your account settings
3. **Create a new OAuth application**:
   - Give it a descriptive name (e.g., "My Task Management Bot")
   - For client credentials flow, the redirect URI is not important.
4. **Save your credentials securely**:
   - `client_id`: A public identifier for your application
   - `client_secret`: A private key - treat this like a password!

<blockquote class="blockquote not-prose not-italic preset-filled-surface-50-950 py-4">
  <strong class="text-lg">
    ☝️ Important: 
  </strong>
  <p class="pl-6">
    Store your `client_secret` securely and never expose it in
    client-side code or version control.
  </p>
</blockquote>

## Getting an Access Token

To get an access token, make a POST request to the token endpoint with your
client credentials:

```bash
curl -X POST https://taskmaster-speakeasyapi.vercel.app/api/auth/oauth2/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Authorization: Basic $(echo -n 'your_client_id:your_client_secret' | base64)" \\
  -d "grant_type=client_credentials"
```

**Replace the placeholders**:

- `your_client_id`: The client ID from your OAuth application
- `your_client_secret`: The client secret from your OAuth application

### Understanding the Request

- **Authorization Header**: We use "Basic" authentication with your client
  credentials encoded in Base64
- **grant_type**: Must be `client_credentials` for this flow
- **Content-Type**: Standard form data encoding

### Successful Response

If everything is correct, you'll get a response like this:

```json
{
  "access_token": "abc123def456...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

- `access_token`: The token you'll use for API requests
- `token_type`: Always "Bearer" for this API
- `expires_in`: Token lifetime in seconds (3600 = 1 hour)

## Using Your Access Token

Now you can make authenticated API requests! Here's how to fetch your tasks:

```bash
curl -X GET https://taskmaster-speakeasyapi.vercel.app/api/tasks \\
  -H "Authorization: Bearer your_access_token"
```

**Replace `your_access_token`** with the actual token from the previous step.

### Expected Response

A successful request will return your tasks:

```json
[
  {
    "id": "task-123",
    "title": "Review API documentation",
    "description": "Update the client credentials flow docs",
    "status": "todo",
    "project_id": "proj-456",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

## Error Handling

### Invalid Credentials (401 Unauthorized)

```json
{
  "error": "invalid_client",
  "error_description": "invalid client credentials"
}
```

**Solutions**: Double-check your client_id and client_secret are correct.

### Expired Token (401 Unauthorized)

```json
{
  "error": "invalid_token",
  "error_description": "The Access Token expired"
}
```

**Solution**: Request a new access token using the same process above.

### Malformed Request (400 Bad Request)

```json
{
  "error": "invalid_request",
  "error_description": "Client authentication required"
}
```

**Solutions**: Ensure you're including the Authorization header and grant_type parameter.

## Security Best Practices

1. **Secure Storage**: Store client credentials in environment variables or
   secure configuration, never in code
2. **Token Management**: Access tokens expire after 1 hour - implement
   automatic token refresh in your application
3. **Principle of Least Privilege**: Only request the permissions your
   application actually needs
4. **Monitor Usage**: Keep track of your API usage and watch for unusual patterns

## Next Steps

Now that you have access tokens working, you can:

- Explore other API endpoints (projects, individual tasks)
- Build automated workflows using the API
- Integrate Taskmaster data into your applications

For more complex scenarios involving user permissions, check out our
Authorization Code flow documentation.
