---
name: validation-error-ux
description: Standard for extracting detailed Zod validation messages and displaying human-readable errors in toasts and UI dialogs
---

# Validation & Error UX Standard

Every API and UI interaction must provide actionable, transparent error messaging to end users:

### 1. Backend: Extracting Zod Issues in `api-response.ts`
When an input validation fails, never return a blank or generic `"Validation failed"`. Extract individual issue messages from `error.issues`:

```typescript
if (error instanceof ZodError) {
  const fieldDetails = error.flatten().fieldErrors;
  const fromIssues = Array.isArray(error.issues)
    ? error.issues.map((issue) => issue.message).filter(Boolean)
    : [];
  const fromFlatten = Object.values(fieldDetails).flat().filter(Boolean) as string[];
  const combined = fromIssues.length > 0 ? fromIssues : fromFlatten;
  const message = combined.length > 0 ? combined.join(". ") : "Validation failed";

  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: {
        message,
        code: "VALIDATION_ERROR",
        details: fieldDetails,
      },
    },
    { status: 400 }
  );
}
```

### 2. Frontend: Toast & Inline Feedback
- **Toast Notifications**: Every form submission error handler must show `data.error?.message`:
  ```typescript
  if (data.success) {
    toast.success("Saved successfully");
  } else {
    toast.error(data.error?.message || "Failed to save record");
  }
  ```
- **Modal Alert Banners**: In dialogs with form inputs, display an inline alert box (`<AlertCircle />`) containing `errorMsg` above form controls so users see the exact validation constraint (e.g. username regex, password minimum length) without losing their entered data.
