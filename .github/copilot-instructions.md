# NCAGE Turf Management App

Turf management system for tracking student attendance and time-based bookings with Firebase backend.

## Architecture

**Angular 19 Standalone Components** - No NgModules. All components use `imports: [...]` in `@Component` decorator.
**Firebase/Firestore** - Not yet configured. When adding, create `src/environments/environment.ts` and initialize in `app.config.ts` with `provideFirebaseApp()` / `provideFirestore()`.
**Bootstrap 5.3** - Installed but not yet imported. Add to `angular.json` styles array and `src/styles.css`.

### Project Structure
```
src/app/
  app.component.ts         # Root component with <router-outlet>
  app.config.ts            # DI providers (routing, Firebase when added)
  app.routes.ts            # Route definitions (currently empty)
```

### Key Dependencies
- Angular 19.2 (core, forms, router)
- Bootstrap 5.3.8 + Bootstrap Icons 1.13
- Firebase 12.7 (SDK installed, not configured)
- TypeScript 5.7 (strict mode enabled)

## Development Commands

```bash
npm start              # Dev server on localhost:4200
npm run build          # Production build to dist/
npm test               # Karma unit tests
ng generate component  # Scaffold new component (standalone by default)
```

## Code Patterns

### Component Creation (Standalone)
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule], // Import dependencies here
  template: `...`
})
export class FeatureComponent {}
```

### Expected Patterns (from requirements)
- **Signal-based state**: Use `signal()`, `computed()`, `effect()` for reactive state
- **Template-driven forms**: Use `FormsModule` with `[(ngModel)]` and validation
- **Firestore real-time**: Subscribe to collection changes with `collectionData()`
- **Pagination**: Dropdown for items per page (5/10/20/50), manual page navigation
- **Print layouts**: Custom CSS with `@media print` for invoices

## Feature Requirements

**Core Collections** (Firestore):
- `students` - Student CRUD operations
- `attendance` - Daily attendance records with date filtering
- `bookings` - Turf time slots (hourly billing model)
- `invoices` - Generated invoices with search capability

**Branding**:
- Logo: "N" in black (#000), "CAGE" in Bootstrap warning/orange
- Bootstrap grid for mobile + laptop responsive layouts

**Components to Create**:
- Dashboard (nav hub), Students, Attendance, Billing, Invoices, Logo

## Configuration Notes

**TypeScript**: Strict mode enabled with `noImplicitReturns`, `noFallthroughCasesInSwitch`
**Build**: Uses `@angular-devkit/build-angular:application` builder (esbuild-based)
**No SSR**: Browser-only build, no server-side rendering
**Bootstrap not yet imported**: Must add to `angular.json` styles and `src/styles.css` before using classes
