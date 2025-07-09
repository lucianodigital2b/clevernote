# CleverNote Project Rules

## React Development Guidelines

### State Management
- **Minimize useEffect usage**: Derive all state where possible instead of using useEffect
- **Prefer derived state**: Calculate values from existing state rather than storing them separately
- **Avoid unnecessary hooks**: Skip useMemo and useCallback - React compiler will handle optimizations
- **Treat UIs as a thin layer**: Skip local state (like useState) unless absolutely needed and clearly separate from business logic
- **Choose variables and useRef**: Use these instead of reactive state when reactivity isn't required

### Component Design
- **Avoid complex conditional rendering**: When you find yourself with nested if/else or complex conditional rendering, create a new component
- **Reserve inline ternaries**: Use inline ternaries only for tiny, readable sections
- **Explicit logic over implicit**: Choose to explicitly define logic rather than depend on implicit reactive behavior

### Code Quality
- **Minimize setTimeout usage**: Treat setTimeout as a last resort and always comment why it's needed
- **Avoid useless comments**: Don't add comments unless you're clarifying a race condition (setTimeout), a long-term TODO, or clarifying confusing code that even a senior engineer wouldn't initially understand

### Performance
- **Trust React compiler**: Let React compiler handle memoization and optimization
- **Focus on data flow**: Optimize data fetching and state updates rather than micro-optimizations

### Best Practices
- **Single responsibility**: Each component should have one clear purpose
- **Predictable data flow**: Make data flow obvious and traceable
- **Error boundaries**: Implement proper error handling for robust applications
- **Accessibility**: Ensure components are accessible by default