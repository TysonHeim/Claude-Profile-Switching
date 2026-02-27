---
name: api-patterns
description: Backend API design patterns — RESTful conventions, error handling, validation, middleware. Use when building API endpoints, designing request/response contracts, or structuring backend code.
---

# API Patterns

## Instructions

When building backend APIs, follow these conventions:

### RESTful Resource Design
- Use nouns for resources: `/users`, `/orders`
- Use HTTP verbs for actions: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)
- Nest sub-resources: `/users/:id/orders`
- Use query params for filtering/sorting: `/users?role=admin&sort=name`

### Response Format
Always return consistent response shapes:
```json
{
  "data": { ... },
  "meta": { "page": 1, "total": 42 }
}
```

For errors:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required",
    "details": [{ "field": "name", "message": "Required" }]
  }
}
```

### Validation
- Validate at the boundary — before business logic runs
- Return 400 for invalid input, 422 for valid-but-unprocessable
- Include field-level error details for form-friendly responses

### Status Codes
| Code | Use |
|------|-----|
| 200 | Success with body |
| 201 | Created (POST) |
| 204 | Success, no body (DELETE) |
| 400 | Bad request / validation |
| 401 | Not authenticated |
| 403 | Not authorized |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 500 | Server error |

## Examples

### Controller Structure
```
controllers/
├── users.controller.ts    # Route handlers
├── users.service.ts       # Business logic
├── users.repository.ts    # Data access
├── users.validator.ts     # Input validation
└── users.types.ts         # Request/response types
```
