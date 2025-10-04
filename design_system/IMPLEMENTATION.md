# Design System Implementation Guide

## Quick Integration Checklist

- [ ] Include the design system CSS file
- [ ] Replace existing classes with design system equivalents
- [ ] Update color values to use CSS variables
- [ ] Test responsive behavior across devices
- [ ] Verify accessibility with screen readers

## Migration from Existing Styles

### 1. Replace Hard-coded Colors

**Before:**
```css
.button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**After:**
```css
.button {
  background: var(--color-primary-gradient);
}
```

### 2. Update Button Classes

**Before:**
```html
<button style="background: #28a745; color: white; padding: 12px 20px;">Save</button>
```

**After:**
```html
<button class="btn btn-secondary">Save</button>
```

### 3. Standardize Form Elements

**Before:**
```html
<input type="text" style="padding: 12px; border: 2px solid #ddd;">
```

**After:**
```html
<input type="text" class="form-input">
```

### 4. Convert to Card System

**Before:**
```html
<div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
```

**After:**
```html
<div class="card-section">
```

## Common Patterns

### Budget Item Layout
```html
<div class="card-item">
  <div class="card-item-info">
    <div class="card-item-name">{{itemName}}</div>
    <div class="card-item-details">
      <span class="card-item-value">${{amount}}</span>
      <span class="card-item-frequency">{{frequency}}</span>
      <span class="card-item-tags">{{tags}}</span>
    </div>
  </div>
  <div class="card-item-actions">
    <button class="btn btn-info btn-sm">Edit</button>
    <button class="btn btn-danger btn-sm">Remove</button>
  </div>
</div>
```

### Form with Validation
```html
<div class="form-group">
  <label for="amount">Amount</label>
  <input type="number" id="amount" class="form-input" required>
  <span class="form-status success" id="amount-status">Valid amount</span>
</div>
```

### Modal Dialog
```html
<div class="modal-overlay" id="confirmModal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Confirm Action</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to proceed?</p>
    </div>
    <div class="modal-footer">
      <button class="modal-btn secondary">Cancel</button>
      <button class="modal-btn primary">Confirm</button>
    </div>
  </div>
</div>
```

## JavaScript Integration

### Modal Control
```javascript
function showModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function hideModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}
```

### Form Validation
```javascript
function validateInput(input) {
  const isValid = input.value.length > 0;
  input.classList.toggle('valid', isValid);
  input.classList.toggle('invalid', !isValid);
  
  const status = input.parentElement.querySelector('.form-status');
  if (status) {
    status.textContent = isValid ? 'Valid' : 'Required field';
    status.className = `form-status ${isValid ? 'success' : 'error'}`;
  }
}
```

### Dynamic Button States
```javascript
function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}
```