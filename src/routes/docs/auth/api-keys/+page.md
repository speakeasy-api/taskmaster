---
title: API Key Authentication
---

## Overview

API keys provide a simple and secure way to authenticate with Taskmaster's API
without the complexity of OAuth flows. Think of an API key as a long-lived
password that identifies your application and grants access to your account's
data.

This is perfect for:

- Server-to-server integrations
- Personal scripts and automation tools
- Backend services that need consistent API access
- Applications where you control both the client and server

Unlike OAuth tokens which expire and require refresh, API keys remain valid
until you explicitly revoke them, making them ideal for long-running
integrations.

This guide will walk you through generating API keys and using them to
authenticate with Taskmaster's API.

## Prerequisites: Generating an API Key

Before you can make authenticated requests, you need to generate an API key
through your Taskmaster account:

1. **Sign up and log into Taskmaster** at [taskmaster-speakeasyapi.vercel.app](https://taskmaster-speakeasyapi.vercel.app)
2. **Navigate to Settings** from your account menu
3. **Go to the Developer page** to access developer tools
4. **Create a new API Key**:
   - Click the "New" button in the API Keys section
   - Give your key a descriptive name (e.g., "My Task Automation Script")
   - Click "Generate Key"
5. **Save your API key securely**:
   - Copy the generated key immediately - you won't be able to see it again
   - Store it in a secure location like environment variables or a password manager

<blockquote class="blockquote not-prose not-italic preset-filled-surface-50-950 py-4">
  <strong class="text-lg">
    ⚠️ Important Security Note: 
  </strong>
  <ul class="list-disc pl-6">
    <li>Treat your API key like a password - never share it publicly</li>
    <li>Don't commit API keys to version control systems</li>
    <li>Use environment variables or secure configuration management</li>
    <li>Revoke and regenerate keys if you suspect they've been compromised</li>
  </ul>
</blockquote>

## Using Your API Key

Once you have an API key, include it in the `x-api-key` header of your API
requests. Here's how to authenticate and fetch your tasks:

```bash
curl -X GET https://taskmaster-speakeasyapi.vercel.app/api/tasks \\
  -H "x-api-key: your_api_key_here"
```

**Replace `your_api_key_here`** with your actual API key from the previous step.

### Expected Response

A successful request will return your tasks:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Review API documentation",
    "description": "Update the API key authentication docs",
    "status": "todo",
    "project_id": "proj-456",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z",
    "created_by": "user_123456"
  }
]
```

## Next Steps

Now that you have API key authentication working, you can:

- Build automated workflows using your favorite programming language
- Integrate Taskmaster data into other applications
- Create custom dashboards and reporting tools
- Set up scheduled tasks to sync data with other systems

For more complex scenarios involving user authorization and permissions, check
out our [Authorization Code Flow](/docs/auth/authorization-code-flow) or
[Client Credentials Flow](/docs/auth/client-credentials-flow) documentation.
