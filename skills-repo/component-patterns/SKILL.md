---
name: component-patterns
description: Frontend component architecture patterns — composition, prop design, state management. Use when building React components, designing component APIs, or structuring UI code.
---

# Component Patterns

## Instructions

When building frontend components, follow these principles:

### Composition Over Configuration
- Prefer composable sub-components over monolithic components with many props
- Use `children` and render props for flexible layouts
- Keep components focused on a single responsibility

### Prop Design
- Use descriptive prop names that read like English: `isOpen`, `onClose`, `variant`
- Prefer enums/unions over booleans for multi-state props: `size: 'sm' | 'md' | 'lg'`
- Default props to the most common use case

### State Management
- Lift state only when siblings need to share it
- Use controlled components for form inputs in shared components
- Keep local state close to where it's used

### File Organization
```
components/
├── MyComponent/
│   ├── MyComponent.tsx        # Main component
│   ├── MyComponent.test.tsx   # Tests
│   ├── useMyComponent.ts      # Custom hook (if complex logic)
│   └── index.ts               # Public exports
```

## Examples

### Composable Component
```tsx
<Card>
  <Card.Header title="Users" />
  <Card.Body>
    <UserList users={users} />
  </Card.Body>
  <Card.Footer>
    <Button onClick={onSave}>Save</Button>
  </Card.Footer>
</Card>
```

### Custom Hook Extraction
Extract logic when a component exceeds ~50 lines of hooks/state:
```tsx
function useUserForm(initialUser) {
  const [form, setForm] = useState(initialUser);
  const [errors, setErrors] = useState({});
  const validate = () => { /* ... */ };
  return { form, setForm, errors, validate };
}
```
