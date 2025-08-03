# Barkly Research Platform - Design System

## 🔒 LOCKED DESIGN RULES

**DO NOT MODIFY WITHOUT APPROVAL**

### Color System
```css
/* NEVER change these values */
--primary: 346 72% 52%;      /* #DC2626 - Brand red */
--secondary: 240 4.8% 95.9%; /* #F1F5F9 - Light grey */
--accent: 197 92% 48%;       /* #0EA5E9 - Brand blue */
--muted: 240 4.8% 95.9%;     /* #F8FAFC - Background grey */
```

### Typography Scale - LOCKED
- `text-xs`: 12px - Labels, captions
- `text-sm`: 14px - Body text, form inputs
- `text-base`: 16px - Default body text
- `text-lg`: 18px - Large body text
- `text-xl`: 20px - Small headings
- `text-2xl`: 24px - Section headings
- `text-3xl`: 30px - Page headings
- `text-4xl`: 36px - Hero headings

### Spacing Scale - LOCKED
- `p-1`: 4px, `p-2`: 8px, `p-3`: 12px, `p-4`: 16px
- `p-6`: 24px, `p-8`: 32px, `p-12`: 48px
- `gap-2`: 8px, `gap-4`: 16px, `gap-6`: 24px, `gap-8`: 32px
- `mb-2`: 8px, `mb-4`: 16px, `mb-6`: 24px, `mb-8`: 32px

### Component Rules - ENFORCED

#### Buttons
```tsx
// PRIMARY: Main actions
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
  
// SECONDARY: Secondary actions  
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md">

// OUTLINE: Tertiary actions
<button className="border border-input hover:bg-accent/10 px-4 py-2 rounded-md">
```

#### Cards
```tsx
// STANDARD CARD
<div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
```

#### Navigation
```tsx
// NAV LINKS
<a className="px-3 py-2 text-sm font-medium transition-colors hover:text-primary">
```

### Grid System - LOCKED
```tsx
// CONTAINER
<div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-7xl">

// RESPONSIVE GRID
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
```

### Cultural Color Usage - SACRED
```css
--cultural-respect: 25 76% 31%;    /* Brown - Earth connection */
--cultural-knowledge: 43 74% 49%;  /* Gold - Wisdom */
--cultural-community: 142 69% 58%; /* Green - Growth */
--cultural-ceremony: 271 91% 65%;  /* Purple - Spiritual */
```

## 🚫 FORBIDDEN PRACTICES

1. **NO custom colors** - Use design tokens only
2. **NO arbitrary values** - Use scale: `p-4` not `p-[16px]`
3. **NO !important** - Fix specificity issues properly  
4. **NO inline styles** - Use Tailwind classes only
5. **NO random spacing** - Follow 4px grid system
6. **NO font changes** - Stick to Inter/Fira Code
7. **NO border-radius changes** - Use `rounded-md`, `rounded-lg`

## ✅ APPROVED PATTERNS

### Page Layout
```tsx
<PageLayout>
  <section className="py-8 lg:py-12">
    <Container>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Page Title</h1>
        <p className="text-lg text-muted-foreground mb-6">Description</p>
      </div>
    </Container>
  </section>
</PageLayout>
```

### Status Badges
```tsx
// SUCCESS
<Badge className="bg-success text-success-foreground">

// WARNING  
<Badge className="bg-warning text-warning-foreground">

// ERROR
<Badge className="bg-destructive text-destructive-foreground">
```

### Loading States
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
  <div className="h-8 bg-muted rounded w-1/2"></div>
</div>
```

## 🔧 DEVELOPMENT RULES

1. **Use component library only** - No custom components without approval
2. **Follow naming conventions** - BEM-like: `component-variant-state`
3. **Mobile first** - Always start with mobile classes
4. **Test all breakpoints** - sm, md, lg, xl
5. **Validate accessibility** - Use semantic HTML, ARIA labels
6. **Check color contrast** - Minimum 4.5:1 ratio

## 🎨 BRAND GUIDELINES

### Logo Usage
- Primary: Red (#DC2626) on white/light backgrounds
- Secondary: White on dark backgrounds  
- Never distort, rotate, or modify

### Voice & Tone
- Respectful and inclusive
- Community-focused language
- Cultural sensitivity paramount
- Professional but approachable

### Cultural Protocols
- Sacred content: Red badges/borders
- Community content: Blue badges/borders  
- Public content: Green badges/borders
- Always acknowledge Traditional Owners

## 📋 COMPONENT CHECKLIST

Before creating/modifying components:
- [ ] Uses design tokens only
- [ ] Follows spacing scale
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Consistent with existing patterns
- [ ] Documented with examples
- [ ] Tested across browsers
- [ ] Cultural protocols respected

## 🚀 DEPLOYMENT CHECKLIST

Before deploying style changes:
- [ ] All pages tested
- [ ] No console errors
- [ ] Lighthouse score >90
- [ ] Responsive on all devices
- [ ] Accessibility validated
- [ ] Cultural review completed
- [ ] Performance impact assessed

---

**Remember: This design system protects our brand integrity and ensures consistent user experience across the platform. When in doubt, ask for approval before making changes.**