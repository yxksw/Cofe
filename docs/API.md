# GraphQL API 文档

## 概述

Cofe 博客系统提供 GraphQL API 接口，用于外部应用（如 iOS/Android App）管理便签数据。

**接口地址**: `https://cofe.050815.xyz/api/graphql`

---

## 认证方式

API 使用 NextAuth 进行身份认证。

### 查询操作（Query）
- **无需认证** - 获取便签列表等公开数据

### 变更操作（Mutation）
- **需要认证** - 创建、更新、删除等操作需要有效的会话令牌

---

## 获取认证令牌

NextAuth 将会话存储为 HTTP-only Cookie，而非 Bearer Token。

### 方法 1：从浏览器提取（开发/测试）

1. **登录 Web 应用**
   - 访问 `https://cofe.050815.xyz/login`
   - 使用 GitHub 账号登录

2. **获取会话令牌**
   - 打开 **开发者工具** (F12)
   - 进入 **Application** → **Cookies** → 选择域名
   - 查找名为 `next-auth.session-token` 或 `__Secure-next-auth.session-token` 的 Cookie
   - **复制 Value** - 这就是你的 `YOUR_TOKEN`

3. **使用 JavaScript 控制台获取**
   ```javascript
   // 登录后在浏览器控制台执行
   document.cookie
     .split('; ')
     .find(row => row.startsWith('next-auth.session-token='))
     ?.split('=')[1]
   ```

### 方法 2：生产环境应用（iOS/Android）

对于移动应用，需要实现 OAuth 流程：

1. **重定向到 GitHub OAuth**
   ```
   https://cofe.050815.xyz/api/auth/signin/github
   ```

2. **处理回调并提取会话 Cookie**
   ```swift
   // iOS 示例
   let session = ASWebAuthenticationSession(
       url: authURL,
       callbackURLScheme: "your-app"
   ) { callbackURL, error in
       // 从响应头中提取会话 Cookie
   }
   ```

3. **安全存储会话令牌** 用于后续 API 调用

---

## 数据类型

### Memo（便签）

```graphql
type Memo {
  id: String!           # 唯一标识符
  content: String!      # 便签内容
  timestamp: String!    # 创建时间戳
  image: String         # 图片 URL（可选）
}
```

### CreateMemoInput（创建便签输入）

```graphql
input CreateMemoInput {
  content: String!      # 便签内容（必填）
  image: String         # 图片 URL（可选）
}
```

---

## 查询操作

### 获取所有便签

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

**返回示例**:
```json
{
  "data": {
    "memos": [
      {
        "id": "memo-001",
        "content": "这是一条测试便签",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "image": "https://example.com/image.jpg"
      }
    ]
  }
}
```

---

## 变更操作

### 创建新便签

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

**变量**:
```json
{
  "input": {
    "content": "你的便签内容",
    "image": "https://example.com/image.jpg"
  }
}
```

**返回示例**:
```json
{
  "data": {
    "createMemo": {
      "id": "memo-002",
      "content": "你的便签内容",
      "timestamp": "2024-01-15T12:00:00.000Z",
      "image": "https://example.com/image.jpg"
    }
  }
}
```

---

## 测试 API

### 1. 使用 cURL

#### 查询操作（无需认证）
```bash
curl -X POST https://cofe.050815.xyz/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetMemos { memos { id content timestamp image } }"
  }'
```

#### 变更操作（需要认证）

**步骤 1**: 从浏览器获取会话令牌

**步骤 2**: 在 Cookie 头中使用令牌
```bash
curl -X POST https://cofe.050815.xyz/api/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN_HERE" \
  -d '{
    "query": "mutation CreateMemo($input: CreateMemoInput!) { createMemo(input: $input) { id content timestamp image } }",
    "variables": {
      "input": {
        "content": "API 测试便签",
        "image": "https://example.com/test.jpg"
      }
    }
  }'
```

### 2. 使用 Postman

#### 查询操作（无需认证）
1. **方法**: POST
2. **URL**: `https://cofe.050815.xyz/api/graphql`
3. **请求头**: `Content-Type: application/json`
4. **请求体** (raw JSON):
   ```json
   {
     "query": "query GetMemos { memos { id content timestamp image } }"
   }
   ```

#### 变更操作（需要认证）
1. **方法**: POST
2. **URL**: `https://cofe.050815.xyz/api/graphql`
3. **请求头**:
   - `Content-Type: application/json`
   - `Cookie: next-auth.session-token=YOUR_TOKEN_HERE`
4. **请求体** (raw JSON):
   ```json
   {
     "query": "mutation CreateMemo($input: CreateMemoInput!) { createMemo(input: $input) { id content timestamp image } }",
     "variables": {
       "input": {
         "content": "Postman 测试便签",
         "image": "https://example.com/image.jpg"
       }
     }
   }
   ```

### 3. 使用浏览器控制台（最简单）

登录 Web 应用后，在浏览器开发者控制台执行：

```javascript
// 查询操作（无需认证）
fetch('/api/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'query GetMemos { memos { id content timestamp } }'
  })
})
.then(res => res.json())
.then(console.log)

// 变更操作（自动使用现有会话）
fetch('/api/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // 包含会话 Cookie
  body: JSON.stringify({
    query: `mutation CreateMemo($input: CreateMemoInput!) { 
      createMemo(input: $input) { id content timestamp } 
    }`,
    variables: {
      input: { content: "浏览器控制台测试!" }
    }
  })
})
.then(res => res.json())
.then(console.log)
```

---

## iOS 应用集成

### 使用 Apollo iOS 客户端

1. **安装 Apollo iOS**:
```swift
dependencies: [
    .package(url: "https://github.com/apollographql/apollo-ios.git", from: "1.0.0")
]
```

2. **生成 GraphQL 类型**:
```bash
# 将 schema.graphql 添加到项目
# 运行代码生成
apollo-ios-cli generate
```

3. **Swift 代码示例**:
```swift
import Apollo

class GraphQLService {
    private var apollo: ApolloClient
    private var sessionToken: String?
    
    init() {
        let store = ApolloStore()
        let client = URLSessionClient()
        let provider = NetworkInterceptorProvider(store: store, client: client)
        let url = URL(string: "https://cofe.050815.xyz/api/graphql")!
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
        
        // 添加会话 Cookie 到请求
        var headers: [String: String] = [:]
        if let token = sessionToken {
            headers["Cookie"] = "next-auth.session-token=\(token)"
        }
        
        apollo.perform(mutation: mutation, context: headers) { result in
            switch result {
            case .success(let graphQLResult):
                if let memo = graphQLResult.data?.createMemo {
                    print("创建便签成功: \(memo.id)")
                }
                if let errors = graphQLResult.errors {
                    print("GraphQL 错误: \(errors)")
                }
            case .failure(let error):
                print("网络错误: \(error)")
            }
        }
    }
    
    // 获取便签列表（无需认证）
    func fetchMemos() {
        let query = GetMemosQuery()
        
        apollo.fetch(query: query) { result in
            switch result {
            case .success(let graphQLResult):
                if let memos = graphQLResult.data?.memos {
                    print("获取到 \(memos.count) 条便签")
                }
            case .failure(let error):
                print("错误: \(error)")
            }
        }
    }
}

// 使用示例
let graphQL = GraphQLService()

// 首先通过 OAuth 认证并获取会话令牌
// 然后设置令牌
graphQL.setSessionToken("eyJ0eXAiOiJKV1QiLCJhbGc...")

// 现在可以创建便签了
graphQL.createMemo(content: "来自 iOS 的便签!")
```

---

## 错误处理

API 返回标准 GraphQL 错误格式：

```json
{
  "errors": [
    {
      "message": "需要认证",
      "locations": [{"line": 1, "column": 1}]
    }
  ]
}
```

### 常见错误

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `需要认证` | 缺少或无效的 JWT 令牌 | 检查 Cookie 中的会话令牌 |
| `创建便签失败` | GitHub API 错误或文件更新失败 | 检查 GitHub 权限和仓库状态 |
| `POST body sent invalid JSON` | JSON 格式错误 | 检查请求体格式和转义字符 |
| `Cannot return null for non-nullable field` | 服务器错误 | 查看服务器日志 |

---

## 速率限制

API 继承了 GitHub 的速率限制，因为它使用 GitHub API 进行数据持久化。

- **已认证请求**: 5000 次/小时
- **未认证请求**: 60 次/小时

---

## 快速参考

### 获取 YOUR_TOKEN 步骤

1. **打开 Web 应用** → `https://cofe.050815.xyz/login`
2. **使用 GitHub 登录**
3. **打开开发者工具** (F12 或右键 → 检查)
4. **进入 Application 标签** → **Cookies** → 选择域名
5. **查找 Cookie**: `next-auth.session-token` 或 `__Secure-next-auth.session-token`
6. **复制 Value** - 这就是你的令牌！

### 快速测试命令

```bash
# 查询操作（无需认证）
curl -X POST https://cofe.050815.xyz/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { memos { id content timestamp } }"}'

# 变更操作（替换 YOUR_TOKEN 为实际令牌）
curl -X POST https://cofe.050815.xyz/api/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"query": "mutation CreateMemo($input: CreateMemoInput!) { createMemo(input: $input) { id content timestamp } }", "variables": {"input": {"content": "API 测试便签"}}}'
```

---

## 相关链接

- [API 文档（英文）](./API_UK.md)
- [项目主页](../README.md)
- [GitHub Issues](https://github.com/yxksw/Cofe/issues)
