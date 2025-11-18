**Q1: Explain the difference between goroutines and OS threads. What's the Go scheduler (G-M-P model)?**
**Answer:**
- Goroutines are lightweight (2KB stack), managed by Go runtime; OS threads are managed by the OS (1-8MB).
- G-M-P: G (goroutines), M (OS threads), P (logical processors). P maps to M; Gs are executed by M via P.
- Benefits: faster creation, lower memory, better context switching, user-space scheduling.

**Q2: How does context.Context work? When should you use it?**
**Answer:**
- Manages cancellation, deadlines, timeouts, and request-scoped values.
- Use for: cancellation propagation, timeouts, request tracing.
- Rules: pass as first parameter, don't store in structs, derive via `context.WithCancel/Timeout/Deadline`.

**Q3: What's a goroutine leak? How do you prevent it?**
**Answer:**
- Leak occurs when a goroutine never terminates.
- Prevention: use contexts for cancellation, close channels, use timeouts, monitor with `runtime.NumGoroutine()`.

**Q4: Explain channel directions and channel patterns (fan-in, fan-out, worker pools).**
**Answer:**
- Directional channels: send-only `chan<-`, receive-only `<-chan`, bidirectional `chan`.
- Fan-out: one channel feeds multiple workers.
- Fan-in: multiple channels feed one channel.
- Worker pool: fixed workers consume from a job channel.

**Q5: Compare sync.Mutex vs sync.RWMutex vs sync.Map vs atomic operations.**
**Answer:**
- `sync.Mutex`: exclusive lock.
- `sync.RWMutex`: many readers OR one writer.
- `sync.Map`: concurrent-safe map (optimized for few writes, many reads).
- `atomic`: lock-free primitives (faster, limited ops).

---

### **2. MEMORY MANAGEMENT & PERFORMANCE**

**Q6: How does Go garbage collector work? Explain GC phases.**
**Answer:**
- Tri-color mark-and-sweep, concurrent, low-latency.
- Phases: mark setup, marking (concurrent), mark termination (stop-the-world), sweep (concurrent).
- Tuned by `GOGC` (100% = GC when memory doubles), can tune via `runtime/debug`.

**Q7: What causes memory leaks in Go?**
**Answer:**
- Goroutine leaks, maps/slices growing indefinitely, caches without eviction, finalizers blocking, `runtime.SetFinalizer` misuse.

**Q8: How do you profile Go applications?**
**Answer:**
- `go tool pprof` (CPU, memory), `go tool trace`, `runtime/pprof`.
- Methods: HTTP endpoints, benchmarks, production sampling.
- Common: CPU hotspots, allocations, goroutine leaks.

**Q9: Explain escape analysis and stack vs heap allocation.**
**Answer:**
- Escape analysis determines if a value escapes the stack.
- Stack: fast, function-local, limited size.
- Heap: slower, shared, GC-managed.
- Use `go build -gcflags=-m` to inspect escapes.

**Q10: How do you optimize Go code performance?**
**Answer:**
- Profile first, reduce allocations, use object pools (`sync.Pool`), reuse buffers, avoid unnecessary copies, use appropriate data structures, leverage compiler optimizations.

---

### **3. INTERFACES & TYPE SYSTEM**

**Q11: Explain Go interfaces and implicit satisfaction.**
**Answer:**
- Interface = set of methods; types implement implicitly.
- Benefits: decoupling, testability, polymorphism.
- Use small interfaces (`io.Reader`, `io.Writer`).

**Q12: What's the empty interface? When should you avoid it?**
**Answer:**
- `interface{}` (or `any`) accepts any type.
- Avoid when type safety is needed; prefer generics (Go 1.18+) or concrete types.

**Q13: Explain type assertions vs type switches.**
**Answer:**
- Assertion: `val, ok := i.(Type)`, `val := i.(Type)` (panics if fails).
- Type switch: `switch v := i.(type) { case int: ... }`.
- Use assertions for single checks, switches for multiple.

**Q14: What are generics? How do you use them?**
**Answer:**
- Type parameters (Go 1.18+).
- Example:
```go
func Min[T comparable](a, b T) T {
    if a < b { return a }
    return b
}
```
- Constraints: `comparable`, `any`, or custom interfaces.

**Q15: Explain type embedding vs composition.**
**Answer:**
- Embedding: inner struct methods promoted to outer.
- Composition: explicit delegation.
- Embedding for "is-a", composition for "has-a".

---

### **4. ERROR HANDLING**

**Q16: How do you handle errors in Go? Best practices?**
**Answer:**
- Explicit error returns, wrap with context (`fmt.Errorf` with `%w`), sentinel errors (`io.EOF`), custom error types, error chains.
- Avoid panics except unrecoverable cases.

**Q17: Explain error wrapping with errors.Is() and errors.As().**
**Answer:**
- `errors.Is(err, target)`: checks if error chain contains target.
- `errors.As(err, &target)`: finds first assignable error in chain.
- Use with `%w` for wrapping.

**Q18: When should you panic vs return an error?**
**Answer:**
- Panic: programmer errors, unrecoverable states.
- Error: expected failures (network, I/O, validation).

---

### **5. PACKAGES, MODULES & DEPENDENCY MANAGEMENT**

**Q19: Explain Go modules (go.mod, versioning, replace, indirect).**
**Answer:**
- `go.mod` defines module and dependencies.
- Versioning: semantic versioning, `v0/v1` for compatibility.
- `replace`: local/substitution dependencies.
- `indirect`: transitive dependencies.

**Q20: What's internal packages? Unexported vs exported?**
**Answer:**
- `internal/`: only accessible within parent module.
- Exported: capitalized (public); unexported: lowercase (private).

**Q21: Explain build tags and conditional compilation.**
**Answer:**
- `//go:build tag` at file top for conditional compilation.
- Examples: `//go:build linux`, `//go:build !windows`, `//go:build debug`.

---

### **6. DATABASE & DATA ACCESS**

**Q22: How do you work with SQL databases in Go? Best practices?**
**Answer:**
- Use `database/sql` with drivers, connection pools, prepared statements, transactions, context for timeouts.
- Best practices: pool configuration, row scanning, closing rows, connection limits.

**Q23: Explain database connection pooling.**
**Answer:**
- `db.SetMaxOpenConns()`, `db.SetMaxIdleConns()`, `db.SetConnMaxLifetime()`.
- Tune based on load and DB limits.

**Q24: How do you handle migrations?**
**Answer:**
- Tools: `golang-migrate`, `goose`, `sql-migrate`.
- Best practices: version control, idempotency, rollback support.

**Q25: Working with NoSQL (MongoDB) in Go?**
**Answer:**
- Use official `go.mongodb.org/mongo-driver`.
- Connection pooling, context usage, bson tags, indexing, aggregation pipelines.

---

### **7. HTTP SERVERS & REST APIs**

**Q26: Compare net/http vs Fiber vs Gin. When to use each?**
**Answer:**
- `net/http`: stdlib, full control, no dependencies.
- Fiber: fast, Express-like, built on fasthttp.
- Gin: balanced, popular middleware ecosystem.
- Choose based on performance needs and team preference.

**Q27: How do you implement middleware in Go?**
**Answer:**
- Chain functions that accept and return `http.Handler`.
- Pattern: `func middleware(next http.Handler) http.Handler`.

**Q28: How do you handle authentication and authorization?**
**Answer:**
- JWT in header/cookie, middleware validation, role-based access control (RBAC), OAuth2, API keys.
- Use `golang-jwt/jwt/v5` for JWT.

**Q29: Explain request validation and sanitization.**
**Answer:**
- Use `validator`, struct tags, custom validators, sanitize inputs to prevent injection.

**Q30: How do you implement rate limiting?**
**Answer:**
- Token bucket, sliding window, middleware.
- Libraries: `golang.org/x/time/rate`, `uber-go/ratelimit`.

---

### **8. TESTING**

**Q31: Explain Go testing (unit, integration, benchmarks, table-driven tests).**
**Answer:**
- `*_test.go`, `Test*`, `Benchmark*`, `Example*`.
- Table-driven: iterate over test cases.
- `t.Helper()`, subtests, test coverage.

**Q32: How do you mock dependencies in tests?**
**Answer:**
- Interfaces for dependency injection, manual mocks, libraries (`testify/mock`, `gomock`), stubs.

**Q33: Explain test coverage and fuzzing.**
**Answer:**
- Coverage: `go test -cover`, `go tool cover`.
- Fuzzing (Go 1.18+): `Fuzz*`, `go test -fuzz`.

---

### **9. MICROSERVICES & DISTRIBUTED SYSTEMS**

**Q34: How do you structure a microservices architecture in Go?**
**Answer:**
- Service boundaries, API Gateway, service discovery, configuration management, health checks, distributed tracing, circuit breakers.

**Q35: Explain service communication (gRPC vs REST).**
**Answer:**
- REST: HTTP/JSON, human-readable, caching-friendly.
- gRPC: HTTP/2, Protocol Buffers, streaming, better performance.
- Use REST for external APIs, gRPC for internal services.

**Q36: How do you handle distributed transactions (saga pattern)?**
**Answer:**
- Saga pattern: orchestration or choreography.
- Compensation, idempotency, event sourcing.

**Q37: Explain circuit breaker pattern.**
**Answer:**
- States: Closed → Open → Half-Open.
- Prevents cascading failures.
- Libraries: `sony/gobreaker`, `hystrix-go`.

**Q38: How do you implement distributed tracing?**
**Answer:**
- OpenTelemetry, correlation IDs, span propagation, tools (Jaeger, Zipkin).

---

### **10. CLOUD & DEPLOYMENT**

**Q39: How do you deploy Go applications to the cloud (GCP, AWS, Azure)?**
**Answer:**
- Docker containers, Kubernetes, serverless (Cloud Run, Lambda), CI/CD pipelines.
- Environment variables, secrets management, health checks.

**Q40: Explain Docker best practices for Go.**
**Answer:**
- Multi-stage builds, minimal base images (`scratch`, `alpine`), non-root user, proper layer caching, build args.

**Q41: How do you manage secrets and configuration?**
**Answer:**
- Secret managers (GCP Secret Manager, AWS Secrets Manager), environment variables, encrypted config files, avoid hardcoding.

---

### **11. ADVANCED TOPICS**

**Q42: Explain reflection in Go. When to use it?**
**Answer:**
- `reflect` package for runtime type inspection.
- Use sparingly: JSON/encoding, ORMs, dependency injection.
- Avoid when types are known at compile time.

**Q43: What are cgo and its implications?**
**Answer:**
- Cgo calls C from Go.
- Implications: slower builds, blocking, complexity, separate binaries.
- Prefer pure Go when possible.

**Q44: Explain Go's build system and cross-compilation.**
**Answer:**
- `GOOS` and `GOARCH` for cross-compilation.
- Example: `GOOS=linux GOARCH=amd64 go build`.

**Q45: How do you handle graceful shutdown?**
**Answer:**
- Signal handling (`os/signal`), context cancellation, close connections/resources, drain requests.

---

### **12. CODE QUALITY & BEST PRACTICES**

**Q46: Go code review checklist.**
**Answer:**
- Error handling, no panics, proper concurrency, no data races, context usage, resource cleanup, documentation, tests.

**Q47: Explain Go idioms and conventions.**
**Answer:**
- Error handling, interfaces, zero values, nil checks, short variable names, package organization, documentation comments.

**Q48: How do you handle versioning in APIs?**
**Answer:**
- URL versioning (`/v1/users`), header versioning, semantic versioning, backward compatibility.

---

### **13. REAL-WORLD SCENARIOS**

**Q49: Design a high-performance HTTP API that handles 10k requests/second.**
**Answer:**
- Connection pooling, caching (Redis), async processing, load balancing, CDN, database optimization, profiling, horizontal scaling.

**Q50: How do you debug a production issue in a distributed Go application?**
**Answer:**
- Logging (structured, correlation IDs), distributed tracing, metrics/monitoring, pprof, stack traces, reproducing locally.

---

### **14. SYSTEM DESIGN QUESTIONS**

**Q51: Design a URL shortener (like bit.ly) in Go.**
**Answer:**
- Requirements, capacity, API design, database schema, encoding algorithm (base62), caching, scaling, analytics.

**Q52: Design a rate limiter for a distributed system.**
**Answer:**
- Token bucket, sliding window, Redis for distributed state, rate limiting strategies, edge cases.

---

### **15. RECENT GO FEATURES (Go 1.18+)**

**Q53: Explain generics and type parameters.**
**Answer:**
- Type parameters, constraints, examples (min/max, collections), backward compatibility.

**Q54: What's workspace mode?**
**Answer:**
- `go.work` file for multi-module development, simplifies local development with multiple modules.

---

### **PRACTICAL CODING EXAMPLES**

Include examples for:
- Worker pool pattern
- Fan-in/Fan-out
- Context cancellation
- Rate limiting
- Circuit breaker
- Health check endpoint
- Graceful shutdown
- Connection pooling
- JWT authentication middleware

---

This guide covers:
- ✅ Concurrency & Goroutines
- ✅ Memory Management
- ✅ Interfaces & Types
- ✅ Error Handling
- ✅ Packages & Modules
- ✅ Database Operations
- ✅ HTTP & APIs
- ✅ Testing
- ✅ Microservices
- ✅ Cloud Deployment
- ✅ Advanced Topics
- ✅ Real-world Scenarios
- ✅ System Design

Should I create this as a markdown file in your root directory? The document will be comprehensive and ready for your interview preparation.