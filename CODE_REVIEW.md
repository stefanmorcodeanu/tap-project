# Code Review & Improvement Recommendations

## Overview
This document outlines improvements based on best practices: DRY, KISS, OOP, Functional Programming, Separation of Concerns, and other software engineering principles.

---

## 🔴 Critical Issues

### 1. **Separation of Concerns - API (`api/src/index.js`)**
**Problem**: All logic is in a single file (routes, business logic, utilities, configuration)
**Impact**: Hard to test, maintain, and scale

**Recommendations**:
- Split into modules:
  - `config/index.js` - Configuration management
  - `routes/aiService.js` - Route handlers
  - `services/ollamaService.js` - Ollama API interactions
  - `utils/sanitization.js` - HTML sanitization utilities
  - `utils/modelSelector.js` - Model selection logic
  - `middleware/errorHandler.js` - Centralized error handling
  - `middleware/validation.js` - Input validation

### 2. **Separation of Concerns - UI (`ui/src/App.jsx`)**
**Problem**: 617-line monolithic component handling state, API calls, sanitization, and rendering
**Impact**: Difficult to test, maintain, and reuse

**Recommendations**:
- Extract components:
  - `components/ModelSelector.jsx` - Model selection UI
  - `components/ChatWindow.jsx` - Message display
  - `components/MessageBubble.jsx` - Individual message rendering
  - `components/PromptInput.jsx` - Input form
  - `components/Toast.jsx` - Toast notifications
- Extract hooks:
  - `hooks/useConfig.js` - Configuration fetching
  - `hooks/useChat.js` - Chat state and message management
  - `hooks/useStreaming.js` - Streaming logic
- Extract utilities:
  - `utils/sanitization.js` - Client-side sanitization
  - `utils/api.js` - API client functions

---

## 🟡 DRY (Don't Repeat Yourself) Violations

### 3. **Duplicated Model Selection Logic**
**Location**: `api/src/index.js` lines 82-86 and 211-215
```javascript
// Duplicated in both /stream and /ai-service/:which endpoints
const choose = () => {
  if (which === MODEL_METADATA.fast.route) return MODEL_A;
  if (which === MODEL_METADATA.slow.route) return MODEL_B;
  return prompt.length > 220 ? MODEL_B : MODEL_A;
};
```

**Fix**: Extract to `utils/modelSelector.js`:
```javascript
export function selectModel(route, prompt = '') {
  if (route === MODEL_METADATA.fast.route) return MODEL_A;
  if (route === MODEL_METADATA.slow.route) return MODEL_B;
  return prompt.length > 220 ? MODEL_B : MODEL_A;
}
```

### 4. **Duplicated Header Setting**
**Location**: `api/src/index.js` lines 98-99 and 225-226
```javascript
res.setHeader("X-Model", model);
res.setHeader("x-model", model);
```

**Fix**: Extract to utility function:
```javascript
function setModelHeader(res, model) {
  res.setHeader("X-Model", model);
  res.setHeader("x-model", model);
}
```

### 5. **Repeated Error Handling Pattern**
**Location**: Multiple try-catch blocks with similar structure
**Fix**: Create centralized error handler middleware

### 6. **Repeated Timeout Cleanup**
**Location**: `ui/src/App.jsx` - Multiple places clearing `autoTimeoutId.current`
**Fix**: Extract to custom hook `useTimeout`

---

## 🟡 KISS (Keep It Simple) Violations

### 7. **Overly Complex State Management in UI**
**Problem**: 15+ state variables and refs in single component
**Location**: `ui/src/App.jsx` lines 70-134

**Current State Variables**:
- `config`, `selected`, `status`, `error`
- `prompt`, `messages`, `timeoutFast`, `timeoutSlow`
- `sending`, `sendError`, `ellipsis`, `thinkSeconds`, `toast`
- Multiple refs: `chatRef`, `currentController`, `currentAssistantIndex`, etc.

**Fix**: Use `useReducer` for complex state:
```javascript
const initialState = {
  config: FALLBACK_CONFIG,
  selected: FALLBACK_CONFIG.defaultRoute,
  status: 'loading',
  // ... consolidate related state
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_CONFIG': return { ...state, config: action.payload };
    case 'SET_SELECTED': return { ...state, selected: action.payload };
    // ... more cases
  }
}
```

### 8. **Complex Nested Message Updates**
**Problem**: Deeply nested `setMessages` calls with complex mapping logic
**Location**: `ui/src/App.jsx` lines 210-220, 273-298, 314-329, etc.

**Fix**: Extract message update logic to helper functions:
```javascript
function updateMessage(messages, index, updater) {
  return messages.map((m, i) => i === index ? updater(m) : m);
}
```

### 9. **Complex Stream Parsing Logic**
**Problem**: Nested `findTextInObj` function with complex recursion
**Location**: `api/src/index.js` lines 112-135

**Fix**: Simplify or extract to separate utility module with tests

---

## 🟡 Functional Programming Improvements

### 10. **Impure Functions**
**Problem**: Functions with side effects not clearly separated

**Examples**:
- `callOllama` - Makes HTTP calls (acceptable, but should be isolated)
- `escapeHtml` - Pure function (good)
- `sanitizeSimple` - Should be pure but defined inside component

**Fix**: 
- Move all pure functions to utility modules
- Clearly separate pure functions from side-effect functions
- Use functional composition where possible

### 11. **Missing Function Purity**
**Location**: `ui/src/App.jsx` - `sanitizeSimple` function (lines 32-69)
**Problem**: Defined inside component, recreated on every render

**Fix**: Extract to `utils/sanitization.js`:
```javascript
export function sanitizeSimple(html) {
  // ... existing logic
}
```

### 12. **Imperative Code Patterns**
**Problem**: Direct DOM manipulation, imperative state updates
**Location**: Multiple places in `ui/src/App.jsx`

**Fix**: Use declarative React patterns, extract to custom hooks

---

## 🟡 OOP Opportunities

### 13. **Service Classes for API**
**Recommendation**: Create service classes for better organization

```javascript
// services/OllamaService.js
class OllamaService {
  constructor(config) {
    this.baseUrl = config.ollamaUrl;
    this.timeout = config.timeout;
  }
  
  async generate(model, prompt, options = {}) {
    // ... implementation
  }
  
  async stream(model, prompt, options = {}) {
    // ... implementation
  }
}
```

### 14. **Model Selector Class**
**Recommendation**: Encapsulate model selection logic

```javascript
// services/ModelSelector.js
class ModelSelector {
  constructor(config) {
    this.config = config;
  }
  
  select(route, prompt = '') {
    // ... selection logic
  }
  
  getMetadata(route) {
    // ... return metadata
  }
}
```

---

## 🟡 Other Improvements

### 15. **Input Validation Missing**
**Problem**: No validation for prompt length, content, or route parameters
**Location**: Both API and UI

**Fix**: Add validation middleware:
```javascript
// middleware/validation.js
export function validatePrompt(req, res, next) {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required and must be a string' });
  }
  if (prompt.length > 10000) {
    return res.status(400).json({ error: 'Prompt too long (max 10000 characters)' });
  }
  next();
}
```

### 16. **Error Handling Inconsistency**
**Problem**: Different error formats, inconsistent status codes
**Location**: Throughout codebase

**Fix**: Standardize error responses:
```javascript
// middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
```

### 17. **Magic Numbers**
**Problem**: Hard-coded values without explanation
**Location**: 
- `api/src/index.js` line 85: `prompt.length > 220`
- `ui/src/App.jsx` line 230: `timeoutSeconds` defaults
- Multiple timeout values

**Fix**: Extract to named constants:
```javascript
const PROMPT_LENGTH_THRESHOLD = 220;
const DEFAULT_FAST_TIMEOUT = 60;
const DEFAULT_SLOW_TIMEOUT = 90;
```

### 18. **Configuration Management**
**Problem**: Environment variables scattered, no validation
**Location**: `api/src/index.js` lines 8-13

**Fix**: Create config module with validation:
```javascript
// config/index.js
import { z } from 'zod'; // or use joi/ajv

const configSchema = z.object({
  port: z.number().default(3000),
  ollamaUrl: z.string().url(),
  modelA: z.string().min(1),
  modelB: z.string().min(1),
  timeout: z.number().positive(),
});

export const config = configSchema.parse({
  port: process.env.PORT,
  ollamaUrl: process.env.OLLAMA_URL,
  // ...
});
```

### 19. **Type Safety**
**Problem**: No TypeScript or runtime type checking
**Impact**: Runtime errors, harder to maintain

**Recommendation**: 
- Option A: Migrate to TypeScript
- Option B: Add JSDoc types and runtime validation (zod/joi)

### 20. **Testing Infrastructure Missing**
**Problem**: No tests for critical logic (sanitization, model selection, streaming)

**Recommendation**: Add tests for:
- Model selection logic
- HTML sanitization (both client and server)
- Stream parsing
- Error handling
- API endpoints

### 21. **Code Duplication in Error Handling**
**Problem**: Similar error handling patterns repeated
**Location**: `ui/src/App.jsx` - Multiple catch blocks

**Fix**: Extract error handling to utility:
```javascript
// utils/errorHandler.js
export function handleStreamError(err, expectedModelName, selected, config) {
  const isAbort = err.name === "AbortError" || /aborted/i.test(err.message);
  // ... centralized error handling logic
}
```

### 22. **Missing Logging**
**Problem**: Only console.log, no structured logging
**Location**: `api/src/index.js` line 243

**Fix**: Use proper logging library (winston, pino):
```javascript
import logger from './utils/logger';

logger.info('API listening', { port: PORT, models: { a: MODEL_A, b: MODEL_B } });
logger.error('Ollama request failed', { error: err.message, model });
```

### 23. **Security Improvements**
**Issues**:
- No rate limiting
- No request size limits (only JSON limit)
- No CORS configuration (currently allows all origins)
- No authentication/authorization

**Recommendations**:
- Add rate limiting middleware (express-rate-limit)
- Configure CORS properly for production
- Add request validation and sanitization
- Consider adding authentication for production use

### 24. **Performance Optimizations**
**Issues**:
- No caching for model metadata
- No connection pooling for Ollama requests
- Large component re-renders

**Recommendations**:
- Cache `/config/models` response
- Use connection pooling for axios
- Memoize expensive computations
- Use React.memo for components

### 25. **Accessibility (a11y)**
**Issues**:
- Missing ARIA labels
- Keyboard navigation could be improved
- No focus management

**Recommendations**:
- Add ARIA labels to interactive elements
- Improve keyboard navigation
- Add focus indicators
- Test with screen readers

### 26. **Code Organization - File Structure**
**Current Structure**:
```
api/src/index.js (246 lines - everything)
ui/src/App.jsx (617 lines - everything)
```

**Recommended Structure**:
```
api/
  src/
    index.js (entry point)
    config/
      index.js
    routes/
      aiService.js
      health.js
    services/
      ollamaService.js
      modelSelector.js
    utils/
      sanitization.js
      validation.js
    middleware/
      errorHandler.js
      validation.js
    types/
      index.js (if using TypeScript)

ui/
  src/
    App.jsx (main component)
    components/
      ModelSelector/
        ModelSelector.jsx
        ModelSelector.css
      ChatWindow/
        ChatWindow.jsx
        MessageBubble.jsx
      PromptInput/
        PromptInput.jsx
      Toast/
        Toast.jsx
    hooks/
      useConfig.js
      useChat.js
      useStreaming.js
      useTimeout.js
    utils/
      api.js
      sanitization.js
      constants.js
    services/
      apiService.js
```

### 27. **Constants Management**
**Problem**: Constants scattered throughout code
**Location**: Multiple files

**Fix**: Centralize constants:
```javascript
// ui/src/utils/constants.js
export const DEFAULT_TIMEOUT_FAST = 30;
export const DEFAULT_TIMEOUT_SLOW = 60;
export const PROMPT_LENGTH_THRESHOLD = 220;
export const ALLOWED_HTML_TAGS = ['b', 'i', 'p', 'br'];
```

### 28. **Environment Variable Validation**
**Problem**: No validation that required env vars are set
**Location**: Both API and UI

**Fix**: Validate on startup:
```javascript
// api/src/config/index.js
const requiredEnvVars = ['OLLAMA_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

---

## 📊 Priority Summary

### High Priority (Do First)
1. ✅ Split monolithic components/files (Separation of Concerns)
2. ✅ Extract duplicated logic (DRY)
3. ✅ Add input validation
4. ✅ Standardize error handling
5. ✅ Extract magic numbers to constants

### Medium Priority
6. ✅ Simplify state management (useReducer)
7. ✅ Extract utility functions
8. ✅ Add configuration validation
9. ✅ Improve code organization
10. ✅ Add logging

### Low Priority (Nice to Have)
11. ✅ Add TypeScript
12. ✅ Add tests
13. ✅ Add rate limiting
14. ✅ Performance optimizations
15. ✅ Accessibility improvements

---

## 📝 Quick Wins (Easy Improvements)

1. **Extract constants** - 15 minutes
2. **Extract utility functions** - 30 minutes
3. **Add input validation** - 1 hour
4. **Standardize error handling** - 1 hour
5. **Extract model selection logic** - 30 minutes

---

## 🎯 Recommended Refactoring Order

1. **Phase 1: Extract Utilities** (Low risk)
   - Move `sanitizeSimple` to utils
   - Extract `escapeHtml` to utils
   - Extract model selection logic
   - Extract constants

2. **Phase 2: Split API** (Medium risk)
   - Create service classes
   - Split routes
   - Add middleware
   - Add validation

3. **Phase 3: Refactor UI** (Higher risk)
   - Extract components
   - Extract hooks
   - Simplify state management
   - Add error boundaries

4. **Phase 4: Enhancements** (Lower priority)
   - Add tests
   - Add logging
   - Add TypeScript
   - Performance optimizations

---

## 📚 Additional Resources

- [React Best Practices](https://react.dev/learn)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)
- [Functional Programming in JavaScript](https://github.com/getify/Functional-Light-JS)

