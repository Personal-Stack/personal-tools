# Budget Planner Design System

A comprehensive design system extracted from the Budget Planner application, providing consistent styling, components, and patterns for financial applications.

## 🎨 Overview

This design system includes:
- **Design Tokens**: Colors, typography, spacing, and layout variables
- **Components**: Buttons, forms, cards, modals, and navigation
- **Patterns**: Common UI patterns and layouts
- **Examples**: Live component showcase and usage examples

## 📁 Structure

```
design_system/
├── tokens/           # Design tokens (CSS variables)
│   ├── colors.css    # Color palette and variants
│   ├── typography.css # Font families, sizes, weights
│   ├── spacing.css   # Margins, padding, gaps, shadows
│   └── layout.css    # Grid systems, breakpoints, containers
├── components/       # Component styles
│   ├── buttons.css   # Button variants and states
│   ├── forms.css     # Form inputs, selects, validation
│   ├── cards.css     # Card layouts and containers
│   ├── modal.css     # Modal overlays and dialogs
│   └── navigation.css # Navigation patterns
├── examples/         # Usage examples
│   └── component-showcase.html # Interactive component demo
├── design-system.css # Main consolidated stylesheet
└── README.md        # This documentation
```

## 🚀 Quick Start

### Option 1: Use the consolidated stylesheet

```html
<link rel="stylesheet" href="design_system/design-system.css">
```

### Option 2: Import individual components

```css
@import 'design_system/tokens/colors.css';
@import 'design_system/tokens/typography.css';
@import 'design_system/components/buttons.css';
@import 'design_system/components/cards.css';
```

## 🎯 Design Tokens

### Colors

The design system uses a carefully selected color palette:

- **Primary**: Gradient from `#667eea` to `#764ba2`
- **Success**: `#28a745` for positive actions and values
- **Danger**: `#dc3545` for errors and destructive actions
- **Warning**: `#ffc107` for alerts and help content
- **Info**: `#17a2b8` for informational content
- **Grays**: Range from `#f8f9fa` (lightest) to `#212529` (darkest)

```css
/* Usage */
.my-element {
  background: var(--color-primary-gradient);
  color: var(--color-white);
  border: var(--border-width-medium) solid var(--color-border-light);
}
```

### Typography

Font system based on Segoe UI with fallbacks:

- **Sizes**: From `--font-size-xs` (0.75rem) to `--font-size-7xl` (2.5rem)
- **Weights**: Light (300), Normal (400), Medium (500), Semibold (600), Bold (700)
- **Line Heights**: Tight (1.2), Normal (1.4), Relaxed (1.6), Loose (1.8)

```css
/* Usage */
.heading {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}
```

### Spacing

Consistent spacing scale based on rem units:

- **Base unit**: 1rem (16px)
- **Scale**: From `--spacing-1` (0.25rem) to `--spacing-20` (5rem)
- **Gaps**: Predefined gaps for grid and flex layouts
- **Shadows**: Multiple shadow levels for depth

```css
/* Usage */
.card {
  padding: var(--spacing-section); /* 25px */
  margin-bottom: var(--spacing-5);  /* 20px */
  box-shadow: var(--shadow-md);
}
```

## 🧩 Components

### Buttons

Multiple button variants for different use cases:

```html
<!-- Primary actions -->
<button class="btn btn-primary">Save Changes</button>
<button class="btn btn-secondary">Cancel</button>

<!-- State-specific buttons -->
<button class="btn btn-success">Confirm</button>
<button class="btn btn-danger">Delete</button>
<button class="btn btn-warning">Warning</button>

<!-- Navigation buttons -->
<a href="/analytics" class="btn btn-nav">📊 Analytics</a>
<button class="btn btn-nav btn-export">📥 Export</button>
<button class="btn btn-nav btn-help">❓ Help</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Regular</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Forms

Comprehensive form system with validation states:

```html
<div class="form-group">
  <label for="budget-amount">Budget Amount</label>
  <input type="number" id="budget-amount" class="form-input" placeholder="0.00">
  <span class="form-status success">Valid amount entered</span>
</div>

<div class="form-group">
  <label for="currency">Currency</label>
  <select id="currency" class="form-select">
    <option value="USD">USD ($)</option>
    <option value="EUR">EUR (€)</option>
  </select>
</div>

<!-- Input with unit -->
<div class="form-group">
  <label for="investment">Investment Amount</label>
  <div class="form-input-with-unit">
    <input type="number" id="investment" class="form-input" placeholder="0.00">
    <span class="form-input-unit">$</span>
  </div>
</div>
```

### Cards

Flexible card system for content organization:

```html
<!-- Section card -->
<section class="card-section">
  <h2>Budget Overview</h2>
  <p>Content goes here...</p>
</section>

<!-- Indicator card -->
<div class="card-indicator">
  <h3>Monthly Budget</h3>
  <div class="card-indicator-value">$2,500</div>
  <small>Available this month</small>
</div>

<!-- Item card -->
<div class="card-item">
  <div class="card-item-info">
    <div class="card-item-name">Grocery Budget</div>
    <div class="card-item-details">
      <span class="card-item-value">$450.00</span>
      <span class="card-item-frequency">monthly</span>
    </div>
  </div>
  <div class="card-item-actions">
    <button class="btn btn-info btn-sm">Edit</button>
    <button class="btn btn-danger btn-sm">Remove</button>
  </div>
</div>
```

### Navigation

Navigation patterns for different contexts:

```html
<!-- Page navigation (on colored background) -->
<nav class="page-nav">
  <a href="/dashboard" class="nav-link">🏠 Dashboard</a>
  <a href="/analytics" class="nav-link">📊 Analytics</a>
  <button class="nav-btn btn-export">📥 Export Data</button>
</nav>

<!-- Tab navigation -->
<nav class="nav-tabs">
  <button class="nav-tab active">Overview</button>
  <button class="nav-tab">Budget Items</button>
  <button class="nav-tab">Reports</button>
</nav>

<!-- Breadcrumb navigation -->
<nav class="nav-breadcrumb">
  <a href="/" class="nav-breadcrumb-item">Home</a>
  <span class="nav-breadcrumb-separator">›</span>
  <a href="/budget" class="nav-breadcrumb-item">Budget</a>
  <span class="nav-breadcrumb-separator">›</span>
  <span class="nav-breadcrumb-item active">Current Item</span>
</nav>
```

### Modals

Modal system for overlays and dialogs:

```html
<div id="helpModal" class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Help & Tips</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <h3>Getting Started</h3>
      <p>Welcome to the Budget Planner...</p>
      
      <div class="modal-privacy-notice">
        <p><strong>Privacy:</strong> All data is stored locally in your browser.</p>
      </div>
    </div>
    <div class="modal-footer">
      <button class="modal-btn secondary" onclick="closeModal()">Close</button>
      <button class="modal-btn primary" onclick="getStarted()">Get Started</button>
    </div>
  </div>
</div>
```

## 📱 Responsive Design

All components include responsive breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Key responsive features:
- Stacked layouts on mobile
- Flexible grid systems
- Touch-friendly button sizes
- Collapsible navigation

## 🎨 Customization

### CSS Variables

Override design tokens to customize the appearance:

```css
:root {
  /* Custom primary color */
  --color-primary-light: #your-color;
  --color-primary-dark: #your-darker-color;
  
  /* Custom spacing */
  --spacing-section: 2rem;
  
  /* Custom typography */
  --font-family-primary: 'Your Font', sans-serif;
}
```

### Component Variants

Extend components with custom variants:

```css
/* Custom button variant */
.btn-custom {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
}

.btn-custom:hover {
  background: linear-gradient(45deg, #ee5a24, #ff6b6b);
}
```

## 🛠 Development Guidelines

### CSS Architecture

- **Utility-first approach**: Use design tokens for consistency
- **Component-based**: Each component is self-contained
- **BEM-inspired naming**: `.component-element--modifier`
- **Mobile-first responsive**: Start with mobile and enhance

### Best Practices

1. **Always use design tokens** instead of hard-coded values
2. **Test responsive behavior** across all breakpoints
3. **Maintain accessibility** with proper contrast and focus states
4. **Follow semantic HTML** structure for better accessibility
5. **Use consistent spacing** from the spacing scale

### Browser Support

- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **CSS Features**: CSS Grid, Flexbox, CSS Variables, CSS Animations
- **Graceful degradation** for older browsers where possible

## 📊 Usage in Budget Planner

This design system is extracted from the Budget Planner application and includes:

- **Financial-specific components**: Budget items, indicators, charts
- **Data visualization**: Chart containers and summary cards
- **Import/export flows**: File upload and status components
- **Multi-currency support**: Flexible input formatting

## 🤝 Contributing

To extend or modify the design system:

1. Follow the existing token structure
2. Add new components to the appropriate files
3. Update examples and documentation
4. Test responsive behavior
5. Maintain accessibility standards

## 📄 License

This design system is part of the Budget Planner project. See the project's LICENSE file for details.

---

## 📞 Support

For questions or issues with the design system:
- Check the [component showcase](examples/component-showcase.html) for live examples
- Review the source CSS files for implementation details
- Follow the established patterns for new components