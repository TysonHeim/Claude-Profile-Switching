---
name: testing-guide
description: Testing patterns and strategies — unit tests, integration tests, test structure, mocking. Use when writing tests, setting up test infrastructure, or choosing what to test.
---

# Testing Guide

## Instructions

### Test Structure (Arrange-Act-Assert)
```
describe('calculateTotal', () => {
  it('applies discount to items over threshold', () => {
    // Arrange
    const items = [{ price: 100, qty: 2 }];
    const discount = 0.1;

    // Act
    const result = calculateTotal(items, discount);

    // Assert
    expect(result).toBe(180);
  });
});
```

### What to Test
- **Always**: Business logic, data transformations, edge cases
- **Usually**: API contracts, component rendering, user interactions
- **Selectively**: Integration points, error paths, boundary conditions
- **Rarely**: Framework internals, trivial getters/setters, styling

### Naming Convention
Test names should read as specifications:
- `it('returns empty array when no items match filter')`
- `it('throws ValidationError when email is invalid')`
- `it('sends notification after order is confirmed')`

### Mocking Strategy
- Mock at boundaries (HTTP, database, file system)
- Don't mock the code under test
- Prefer fakes over mocks when the setup is complex
- Reset mocks between tests to prevent leakage
