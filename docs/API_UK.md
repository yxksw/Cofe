# GraphQL API Documentation

## Overview

The Cofe blog system provides GraphQL API endpoints for external applications (such as iOS/Android apps) to manage memo data.

**Endpoint**: `https://cofe.381359.xyz/api/graphql`

---

## Authentication

The API uses NextAuth for authentication.

### Query Operations
- **No authentication required** - For public data like fetching memo lists

### Mutation Operations
- **Authentication required** - For create, update, delete operations

---

## Getting Authentication Token

NextAuth stores sessions as HTTP-only cookies, not Bearer tokens.

### Method 1: Extract from Browser (Development/Testing)

1. **Login to Web App**
   - Visit `https://cofe.381359.xyz/login`
   - Sign in with GitHub

2. **Get Session Token**
   - Open **Developer Tools** (F12)
   - Go to **Application** → **Cookies** → Select your domain
   - Find cookie named `next-auth.session-token` or `__Secure-next-auth.session-token`
   - **Copy the Value** - this is your `YOUR_TOKEN`

3. **Using JavaScript Console**
   ```javascript
   // Execute in browser console after login
   document.cookie
     .split('; ')
     .find(row => row.startsWith('next-auth.session-token='))
     ?.split('=')[1]
   ```

### Method 2: Production Apps (iOS/Android)

For mobile apps, implement OAuth flow:

1. **Redirect to GitHub OAuth**
   ```
   https://cofe.381359.xyz/api/auth/signin/github
   ```

2. **Handle callback and extract session cookie**
   ```swift
   // iOS Example
   let session = ASWebAuthenticationSession(
       url: authURL,
       callbackURLScheme: "your-app"
   ) { callbackURL, error in
       // Extract session cookie from response headers
   }
   ```

3. **Store session token securely** for future API calls

---

## Data Types

### Memo

```graphql
type Memo {
  id: String!           # Unique identifier
  content: String!      # Memo content
  timestamp: String!    # Creation timestamp
  image: String         # Image URL (optional)
}
```

### CreateMemoInput

```graphql
input CreateMemoInput {
  content: String!      # Memo content (required)
  image: String         # Image URL (optional)
}
```

---

## Query Operations

### Get All Memos

```graphql
query GetMemos {
  memos {
    id
    content
    timestamp
    image
  }
}
```

**Response Example**:
```json
{
  "data": {
    "memos": [
      {
        "id": "memo-001",
        "content": "This is a test memo",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "image": "https://example.com/image.jpg"
      }
    ]
  }
}
```

---

## Mutation Operations

### Create New Memo

```graphql
mutation CreateMemo($input: CreateMemoInput!) {
  createMemo(input: $input) {
    id
    content
    timestamp
    image
  }
}
```

**Variables**:
```json
{
  "input": {
    "content": "Your memo content",
    "image": "https://example.com/image.jpg"
  }
}
```

**Response Example**:
```json
{
  "data": {
    "createMemo": {
      "id": "memo-002",
      "content": "Your memo content",
      "timestamp": "2024-01-15T12:00:00.000Z",
      "image": "https://example.com/image.jpg"
    }
  }
}
```

---

## Testing the API

### 1. Using cURL

#### Query (No Auth)
```bash
curl -X POST https://cofe.381359.xyz/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetMemos { memos { id content timestamp image } }"
  }'
```

#### Mutation (With Auth)

**Step 1**: Get session token from browser

**Step 2**: Use token in Cookie header
```bash
curl -X POST https://cofe.381359.xyz/api/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN_HERE" \
  -d '{
    "query": "mutation CreateMemo($input: CreateMemoInput!) { createMemo(input: $input) { id content timestamp image } }",
    "variables": {
      "input": {
        "content": "API test memo",
        "image": "https://example.com/test.jpg"
      }
    }
  }'
```

### 2. Using Postman

#### Query (No Auth)
1. **Method**: POST
2. **URL**: `https://cofe.381359.xyz/api/graphql`
3. **Headers**: `Content-Type: application/json`
4. **Body** (raw JSON):
   ```json
   {
     "query": "query GetMemos { memos { id content timestamp image } }"
   }
   ```

#### Mutation (With Auth)
1. **Method**: POST
2. **URL**: `https://cofe.381359.xyz/api/graphql`
3. **Headers**:
   - `Content-Type: application/json`
   - `Cookie: next-auth.session-token=YOUR_TOKEN_HERE`
4. **Body** (raw JSON):
   ```json
   {
     "query": "mutation CreateMemo($input: CreateMemoInput!) { createMemo(input: $input) { id content timestamp image } }",
     "variables": {
       "input": {
         "content": "Postman test memo",
         "image": "https://example.com/image.jpg"
       }
     }
   }
   ```

### 3. Using Browser Console (Easiest)

After logging into the web app, open browser Developer Console and run:

```javascript
// Query (no auth needed)
fetch('/api/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'query GetMemos { memos { id content timestamp } }'
  })
})
.then(res => res.json())
.then(console.log)

// Mutation (uses existing session automatically)
fetch('/api/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Include session cookies
  body: JSON.stringify({
    query: `mutation CreateMemo($input: CreateMemoInput!) { 
      createMemo(input: $input) { id content timestamp } 
    }`,
    variables: {
      input: { content: "Browser console test!" }
    }
  })
})
.then(res => res.json())
.then(console.log)
```

---

## iOS App Integration

### Using Apollo iOS Client

1. **Install Apollo iOS**:
```swift
dependencies: [
    .package(url: "https://github.com/apollographql/apollo-ios.git", from: "1.0.0")
]
```

2. **Generate GraphQL types**:
```bash
# Add schema.graphql to your project
# Run codegen
apollo-ios-cli generate
```

3. **Swift Code Example**:
```swift
import Apollo

class GraphQLService {
    private var apollo: ApolloClient
    private var sessionToken: String?
    
    init() {
        let store = ApolloStore()
        let client = URLSessionClient()
        let provider = NetworkInterceptorProvider(store: store, client: client)
        let url = URL(string: "https://cofe.381359.xyz/api/graphql")!
        let transport = RequestChainNetworkTransport(
            interceptorProvider: provider, 
            endpointURL: url
        )
        self.apollo = ApolloClient(networkTransport: transport, store: store)
    }
    
    func setSessionToken(_ token: String) {
        self.sessionToken = token
    }
    
    func createMemo(content: String, image: String? = nil) {
        let mutation = CreateMemoMutation(
            input: CreateMemoInput(content: content, image: image)
        )
        
        // Add session cookie to request
        var headers: [String: String] = [:]
        if let token = sessionToken {
            headers["Cookie"] = "next-auth.session-token=\(token)"
        }
        
        apollo.perform(mutation: mutation, context: headers) { result in
            switch result {
            case .success(let graphQLResult):
                if let memo = graphQLResult.data?.createMemo {
                    print("Created memo: \(memo.id)")
                }
                if let errors = graphQLResult.errors {
                    print("GraphQL errors: \(errors)")
                }
            case .failure(let error):
                print("Network error: \(error)")
            }
        }
    }
    
    // Fetch memos (no auth required)
    func fetchMemos() {
        let query = GetMemosQuery()
        
        apollo.fetch(query: query) { result in
            switch result {
            case .success(let graphQLResult):
                if let memos = graphQLResult.data?.memos {
                    print("Fetched \(memos.count) memos")
                }
            case .failure(let error):
                print("Error: \(error)")
            }
        }
    }
}

// Usage
let graphQL = GraphQLService()

// First, authenticate and get session token through OAuth
// Then set it:
graphQL.setSessionToken("eyJ0eXAiOiJKV1QiLCJhbGc...")

// Now you can create memos
graphQL.createMemo(content: "Hello from iOS!")
```

---

## Error Handling

The API returns standard GraphQL errors:

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "locations": [{"line": 1, "column": 1}]
    }
  ]
}
```

### Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Authentication required` | Missing or invalid JWT token | Check session token in Cookie |
| `Failed to create memo` | GitHub API error or file update failure | Check GitHub permissions and repo status |
| `POST body sent invalid JSON` | JSON format error | Check request body format and escaping |
| `Cannot return null for non-nullable field` | Server error | Check server logs |

---

## Rate Limits

The API inherits GitHub's rate limits since it uses the GitHub API for data persistence.

- **Authenticated requests**: 5000/hour
- **Unauthenticated requests**: 60/hour

---

## Quick Reference

### Getting YOUR_TOKEN (Step by Step)

1. **Open Web App** → `https://cofe.381359.xyz/login`
2. **Login with GitHub**
3. **Open Developer Tools** (F12 or Right-click → Inspect)
4. **Go to Application tab** → **Cookies** → Select your domain
5. **Find Cookie**: `next-auth.session-token` or `__Secure-next-auth.session-token`
6. **Copy Value** - that's your token!

### Quick Test Commands

```bash
# Query (no auth needed)
curl -X POST https://cofe.381359.xyz/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { memos { id content timestamp } }"}'

# Mutation (replace YOUR_TOKEN with actual token)
curl -X POST https://cofe.381359.xyz/api/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"query": "mutation CreateMemo($input: CreateMemoInput!) { createMemo(input: $input) { id content timestamp } }", "variables": {"input": {"content": "API test memo"}}}'
```

---

## Related Links

- [API Documentation (Chinese)](./API.md)
- [Project Homepage](../README.md)
- [GitHub Issues](https://github.com/yxksw/Cofe-Blog/issues)
