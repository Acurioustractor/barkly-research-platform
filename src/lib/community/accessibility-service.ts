import { supabase } from '@/lib/db/supabase';

export interface AccessibilityPreferences {
  userId: string;
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  audioDescriptions: boolean;
  captionsEnabled: boolean;
  colorBlindnessType: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  language: string;
  culturalAccessibility: {
    preferredLanguage: string;
    culturalContext: string;
    traditionalInterface: boolean;
    elderFriendlyMode: boolean;
    youthMode: boolean;
  };
  assistiveTechnology: {
    screenReaderType?: string;
    voiceControl: boolean;
    switchNavigation: boolean;
    eyeTracking: boolean;
  };
}

export interface AccessibilityAudit {
  id: string;
  componentId: string;
  componentName: string;
  auditDate: Date;
  wcagLevel: 'A' | 'AA' | 'AAA';
  issues: AccessibilityIssue[];
  score: number;
  recommendations: string[];
  culturalConsiderations: string[];
}

export interface AccessibilityIssue {
  id: string;
  type: 'color-contrast' | 'keyboard-navigation' | 'screen-reader' | 'focus-management' | 'semantic-markup' | 'cultural-sensitivity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  element: string;
  wcagCriterion: string;
  suggestion: string;
  culturalContext?: string;
}

export interface AudioDescription {
  id: string;
  contentId: string;
  contentType: 'story' | 'event' | 'document' | 'interface';
  language: string;
  description: string;
  timestamp?: number;
  culturalContext?: string;
}

export interface CulturalAccessibilityGuide {
  id: string;
  communityId: string;
  language: string;
  culturalContext: string;
  accessibilityGuidelines: {
    colorMeanings: { [color: string]: string };
    symbolInterpretations: { [symbol: string]: string };
    navigationPatterns: string[];
    communicationStyles: string[];
    respectfulInteractions: string[];
  };
  elderConsiderations: string[];
  youthConsiderations: string[];
  literacySupport: {
    audioSupport: boolean;
    visualSupport: boolean;
    simplifiedLanguage: boolean;
    culturalMetaphors: boolean;
  };
}

/**
 * Accessibility Service
 * Provides comprehensive accessibility support including WCAG compliance,
 * cultural accessibility, and assistive technology integration
 */
export class AccessibilityService {
  private preferences: Map<string, AccessibilityPreferences> = new Map();
  private audioDescriptions: Map<string, AudioDescription[]> = new Map();
  private culturalGuides: Map<string, CulturalAccessibilityGuide> = new Map();

  constructor() {
    this.initializeAccessibility();
  }

  /**
   * Initialize accessibility features
   */
  private async initializeAccessibility(): Promise<void> {
    try {
      // Apply system preferences
      await this.applySystemPreferences();
      
      // Set up keyboard navigation
      this.setupKeyboardNavigation();
      
      // Initialize screen reader support
      this.initializeScreenReaderSupport();
      
      // Set up focus management
      this.setupFocusManagement();
      
      // Apply cultural accessibility
      await this.loadCulturalAccessibilityGuides();
      
      console.log('Accessibility service initialized');
    } catch (error) {
      console.error('Error initializing accessibility service:', error);
    }
  }

  /**
   * Load user accessibility preferences
   */
  public async loadUserPreferences(userId: string): Promise<AccessibilityPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_accessibility_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const preferences: AccessibilityPreferences = {
          userId,
          highContrast: data.high_contrast || false,
          reducedMotion: data.reduced_motion || false,
          largeText: data.large_text || false,
          screenReader: data.screen_reader || false,
          keyboardNavigation: data.keyboard_navigation || false,
          audioDescriptions: data.audio_descriptions || false,
          captionsEnabled: data.captions_enabled || false,
          colorBlindnessType: data.color_blindness_type || 'none',
          fontSize: data.font_size || 'medium',
          language: data.language || 'en',
          culturalAccessibility: data.cultural_accessibility || {
            preferredLanguage: 'en',
            culturalContext: 'general',
            traditionalInterface: false,
            elderFriendlyMode: false,
            youthMode: false
          },
          assistiveTechnology: data.assistive_technology || {
            voiceControl: false,
            switchNavigation: false,
            eyeTracking: false
          }
        };

        this.preferences.set(userId, preferences);
        await this.applyUserPreferences(preferences);
        
        return preferences;
      }

      return null;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  }

  /**
   * Save user accessibility preferences
   */
  public async saveUserPreferences(preferences: AccessibilityPreferences): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_accessibility_preferences')
        .upsert([
          {
            user_id: preferences.userId,
            high_contrast: preferences.highContrast,
            reduced_motion: preferences.reducedMotion,
            large_text: preferences.largeText,
            screen_reader: preferences.screenReader,
            keyboard_navigation: preferences.keyboardNavigation,
            audio_descriptions: preferences.audioDescriptions,
            captions_enabled: preferences.captionsEnabled,
            color_blindness_type: preferences.colorBlindnessType,
            font_size: preferences.fontSize,
            language: preferences.language,
            cultural_accessibility: preferences.culturalAccessibility,
            assistive_technology: preferences.assistiveTechnology,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      this.preferences.set(preferences.userId, preferences);
      await this.applyUserPreferences(preferences);
      
      console.log('User accessibility preferences saved');
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  /**
   * Apply system accessibility preferences
   */
  private async applySystemPreferences(): Promise<void> {
    try {
      // Check for system preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Apply system preferences
      if (prefersReducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      }

      if (prefersHighContrast) {
        document.documentElement.classList.add('high-contrast');
      }

      if (prefersDarkMode) {
        document.documentElement.classList.add('dark-mode');
      }

      // Listen for changes
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        document.documentElement.classList.toggle('reduce-motion', e.matches);
      });

      window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
        document.documentElement.classList.toggle('high-contrast', e.matches);
      });

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        document.documentElement.classList.toggle('dark-mode', e.matches);
      });
    } catch (error) {
      console.error('Error applying system preferences:', error);
    }
  }

  /**
   * Apply user accessibility preferences
   */
  private async applyUserPreferences(preferences: AccessibilityPreferences): Promise<void> {
    try {
      const root = document.documentElement;

      // High contrast
      root.classList.toggle('user-high-contrast', preferences.highContrast);

      // Reduced motion
      root.classList.toggle('user-reduce-motion', preferences.reducedMotion);

      // Large text
      root.classList.toggle('large-text', preferences.largeText);

      // Font size
      root.setAttribute('data-font-size', preferences.fontSize);

      // Color blindness support
      root.setAttribute('data-color-blindness', preferences.colorBlindnessType);

      // Screen reader support
      root.classList.toggle('screen-reader-active', preferences.screenReader);

      // Keyboard navigation
      root.classList.toggle('keyboard-navigation', preferences.keyboardNavigation);

      // Cultural accessibility
      root.setAttribute('data-cultural-context', preferences.culturalAccessibility.culturalContext);
      root.classList.toggle('elder-friendly', preferences.culturalAccessibility.elderFriendlyMode);
      root.classList.toggle('youth-mode', preferences.culturalAccessibility.youthMode);
      root.classList.toggle('traditional-interface', preferences.culturalAccessibility.traditionalInterface);

      // Language
      root.setAttribute('lang', preferences.language);

      // Apply CSS custom properties for dynamic theming
      this.applyCSSCustomProperties(preferences);

      console.log('User accessibility preferences applied');
    } catch (error) {
      console.error('Error applying user preferences:', error);
    }
  }

  /**
   * Apply CSS custom properties for accessibility
   */
  private applyCSSCustomProperties(preferences: AccessibilityPreferences): void {
    const root = document.documentElement;

    // Font size scaling
    const fontSizeScale = {
      'small': '0.875',
      'medium': '1',
      'large': '1.125',
      'extra-large': '1.25'
    };
    root.style.setProperty('--font-size-scale', fontSizeScale[preferences.fontSize]);

    // Color blindness filters
    const colorFilters = {
      'protanopia': 'url(#protanopia-filter)',
      'deuteranopia': 'url(#deuteranopia-filter)',
      'tritanopia': 'url(#tritanopia-filter)',
      'achromatopsia': 'grayscale(100%)',
      'none': 'none'
    };
    root.style.setProperty('--color-filter', colorFilters[preferences.colorBlindnessType]);

    // High contrast colors
    if (preferences.highContrast) {
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--background-color', '#ffffff');
      root.style.setProperty('--border-color', '#000000');
      root.style.setProperty('--focus-color', '#ff0000');
    }
  }

  /**
   * Set up keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    // Skip links
    this.createSkipLinks();

    // Focus management
    document.addEventListener('keydown', (event) => {
      // Tab navigation enhancement
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation-active');
      }

      // Escape key handling
      if (event.key === 'Escape') {
        this.handleEscapeKey();
      }

      // Arrow key navigation for custom components
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.handleArrowKeyNavigation(event);
      }
    });

    // Remove keyboard navigation class on mouse use
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation-active');
    });
  }

  /**
   * Create skip links for keyboard navigation
   */
  private createSkipLinks(): void {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
    `;

    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  /**
   * Handle escape key for modal/dialog dismissal
   */
  private handleEscapeKey(): void {
    // Close any open modals or dialogs
    const openModals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
    openModals.forEach(modal => {
      const closeButton = modal.querySelector('[data-dismiss="modal"]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    });

    // Close any open dropdowns
    const openDropdowns = document.querySelectorAll('[aria-expanded="true"]');
    openDropdowns.forEach(dropdown => {
      dropdown.setAttribute('aria-expanded', 'false');
    });
  }

  /**
   * Handle arrow key navigation for custom components
   */
  private handleArrowKeyNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Handle navigation in lists
    if (target.closest('[role="listbox"], [role="menu"], [role="tablist"]')) {
      event.preventDefault();
      this.navigateInList(target, event.key);
    }

    // Handle navigation in grids
    if (target.closest('[role="grid"]')) {
      event.preventDefault();
      this.navigateInGrid(target, event.key);
    }
  }

  /**
   * Navigate within list components
   */
  private navigateInList(target: HTMLElement, key: string): void {
    const container = target.closest('[role="listbox"], [role="menu"], [role="tablist"]');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('[role="option"], [role="menuitem"], [role="tab"]'));
    const currentIndex = items.indexOf(target);

    let nextIndex = currentIndex;
    if (key === 'ArrowDown' || key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    }

    if (nextIndex !== currentIndex) {
      (items[nextIndex] as HTMLElement).focus();
    }
  }

  /**
   * Navigate within grid components
   */
  private navigateInGrid(target: HTMLElement, key: string): void {
    const grid = target.closest('[role="grid"]');
    if (!grid) return;

    const rows = Array.from(grid.querySelectorAll('[role="row"]'));
    const currentCell = target.closest('[role="gridcell"]');
    if (!currentCell) return;

    const currentRow = currentCell.closest('[role="row"]');
    const currentRowIndex = rows.indexOf(currentRow as Element);
    const cellsInRow = Array.from(currentRow!.querySelectorAll('[role="gridcell"]'));
    const currentCellIndex = cellsInRow.indexOf(currentCell as Element);

    let targetCell: HTMLElement | null = null;

    switch (key) {
      case 'ArrowRight':
        if (currentCellIndex < cellsInRow.length - 1) {
          targetCell = cellsInRow[currentCellIndex + 1] as HTMLElement;
        }
        break;
      case 'ArrowLeft':
        if (currentCellIndex > 0) {
          targetCell = cellsInRow[currentCellIndex - 1] as HTMLElement;
        }
        break;
      case 'ArrowDown':
        if (currentRowIndex < rows.length - 1) {
          const nextRowCells = rows[currentRowIndex + 1].querySelectorAll('[role="gridcell"]');
          if (nextRowCells[currentCellIndex]) {
            targetCell = nextRowCells[currentCellIndex] as HTMLElement;
          }
        }
        break;
      case 'ArrowUp':
        if (currentRowIndex > 0) {
          const prevRowCells = rows[currentRowIndex - 1].querySelectorAll('[role="gridcell"]');
          if (prevRowCells[currentCellIndex]) {
            targetCell = prevRowCells[currentCellIndex] as HTMLElement;
          }
        }
        break;
    }

    if (targetCell) {
      targetCell.focus();
    }
  }

  /**
   * Initialize screen reader support
   */
  private initializeScreenReaderSupport(): void {
    // Add live regions for dynamic content
    this.createLiveRegions();

    // Enhance form labels and descriptions
    this.enhanceFormAccessibility();

    // Add landmark roles
    this.addLandmarkRoles();

    // Set up announcement system
    this.setupAnnouncementSystem();
  }

  /**
   * Create ARIA live regions for dynamic content
   */
  private createLiveRegions(): void {
    // Polite live region for non-urgent updates
    const politeRegion = document.createElement('div');
    politeRegion.id = 'polite-live-region';
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only';
    document.body.appendChild(politeRegion);

    // Assertive live region for urgent updates
    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'assertive-live-region';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    document.body.appendChild(assertiveRegion);

    // Status region for status updates
    const statusRegion = document.createElement('div');
    statusRegion.id = 'status-live-region';
    statusRegion.setAttribute('role', 'status');
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.className = 'sr-only';
    document.body.appendChild(statusRegion);
  }

  /**
   * Enhance form accessibility
   */
  private enhanceFormAccessibility(): void {
    // Add proper labels and descriptions to form elements
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        this.enhanceFormElement(input as HTMLElement);
      });
    });
  }

  /**
   * Enhance individual form element accessibility
   */
  private enhanceFormElement(element: HTMLElement): void {
    const input = element as HTMLInputElement;
    
    // Ensure proper labeling
    if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label && input.id) {
        // Create implicit label relationship
        const parentLabel = input.closest('label');
        if (!parentLabel) {
          console.warn(`Form element ${input.id} lacks proper labeling`);
        }
      }
    }

    // Add error message association
    const errorElement = document.querySelector(`[data-error-for="${input.id}"]`);
    if (errorElement) {
      input.setAttribute('aria-describedby', errorElement.id);
      input.setAttribute('aria-invalid', 'true');
    }

    // Add required field indication
    if (input.required) {
      input.setAttribute('aria-required', 'true');
    }
  }

  /**
   * Add landmark roles to page sections
   */
  private addLandmarkRoles(): void {
    // Main content
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }

    // Navigation
    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
    }

    // Header
    const header = document.querySelector('header');
    if (header && !header.getAttribute('role')) {
      header.setAttribute('role', 'banner');
    }

    // Footer
    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
    }

    // Search
    const search = document.querySelector('[data-search]');
    if (search && !search.getAttribute('role')) {
      search.setAttribute('role', 'search');
    }
  }

  /**
   * Set up announcement system for screen readers
   */
  private setupAnnouncementSystem(): void {
    // Create announcement queue
    const announcementQueue: string[] = [];
    let isAnnouncing = false;

    // Process announcement queue
    const processQueue = () => {
      if (announcementQueue.length > 0 && !isAnnouncing) {
        isAnnouncing = true;
        const message = announcementQueue.shift()!;
        this.announceToScreenReader(message, 'polite');
        
        setTimeout(() => {
          isAnnouncing = false;
          processQueue();
        }, 1000);
      }
    };

    // Expose global announcement function
    (window as any).announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (priority === 'assertive') {
        this.announceToScreenReader(message, priority);
      } else {
        announcementQueue.push(message);
        processQueue();
      }
    };
  }

  /**
   * Announce message to screen reader
   */
  public announceToScreenReader(message: string, priority: 'polite' | 'assertive' | 'status' = 'polite'): void {
    const regionId = priority === 'assertive' ? 'assertive-live-region' : 
                    priority === 'status' ? 'status-live-region' : 'polite-live-region';
    
    const region = document.getElementById(regionId);
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  /**
   * Set up focus management
   */
  private setupFocusManagement(): void {
    // Focus trap for modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"][aria-hidden="false"]');
        if (modal) {
          this.trapFocus(event, modal as HTMLElement);
        }
      }
    });

    // Focus restoration
    this.setupFocusRestoration();
  }

  /**
   * Trap focus within an element
   */
  private trapFocus(event: KeyboardEvent, container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Set up focus restoration for dynamic content
   */
  private setupFocusRestoration(): void {
    let lastFocusedElement: HTMLElement | null = null;

    // Store focus before modal opens
    document.addEventListener('modal-open', () => {
      lastFocusedElement = document.activeElement as HTMLElement;
    });

    // Restore focus when modal closes
    document.addEventListener('modal-close', () => {
      if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
      }
    });
  }

  /**
   * Load cultural accessibility guides
   */
  private async loadCulturalAccessibilityGuides(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('cultural_accessibility_guides')
        .select('*');

      if (error) {
        throw error;
      }

      if (data) {
        data.forEach(guide => {
          this.culturalGuides.set(guide.community_id, {
            id: guide.id,
            communityId: guide.community_id,
            language: guide.language,
            culturalContext: guide.cultural_context,
            accessibilityGuidelines: guide.accessibility_guidelines,
            elderConsiderations: guide.elder_considerations || [],
            youthConsiderations: guide.youth_considerations || [],
            literacySupport: guide.literacy_support || {
              audioSupport: false,
              visualSupport: false,
              simplifiedLanguage: false,
              culturalMetaphors: false
            }
          });
        });
      }

      console.log(`Loaded ${data?.length || 0} cultural accessibility guides`);
    } catch (error) {
      console.error('Error loading cultural accessibility guides:', error);
    }
  }

  /**
   * Get cultural accessibility guide for community
   */
  public getCulturalAccessibilityGuide(communityId: string): CulturalAccessibilityGuide | null {
    return this.culturalGuides.get(communityId) || null;
  }

  /**
   * Generate audio description for content
   */
  public async generateAudioDescription(
    contentId: string,
    contentType: AudioDescription['contentType'],
    language: string = 'en',
    culturalContext?: string
  ): Promise<AudioDescription | null> {
    try {
      // This would integrate with AI service to generate descriptions
      // For now, return a placeholder
      const description: AudioDescription = {
        id: `audio-desc-${contentId}-${Date.now()}`,
        contentId,
        contentType,
        language,
        description: 'Audio description would be generated here',
        culturalContext
      };

      // Cache the description
      const descriptions = this.audioDescriptions.get(contentId) || [];
      descriptions.push(description);
      this.audioDescriptions.set(contentId, descriptions);

      return description;
    } catch (error) {
      console.error('Error generating audio description:', error);
      return null;
    }
  }

  /**
   * Get audio descriptions for content
   */
  public getAudioDescriptions(contentId: string, language?: string): AudioDescription[] {
    const descriptions = this.audioDescriptions.get(contentId) || [];
    
    if (language) {
      return descriptions.filter(desc => desc.language === language);
    }
    
    return descriptions;
  }

  /**
   * Perform accessibility audit on component
   */
  public async performAccessibilityAudit(
    componentId: string,
    componentName: string
  ): Promise<AccessibilityAudit> {
    try {
      const component = document.getElementById(componentId);
      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }

      const issues: AccessibilityIssue[] = [];

      // Check color contrast
      issues.push(...this.checkColorContrast(component));

      // Check keyboard navigation
      issues.push(...this.checkKeyboardNavigation(component));

      // Check screen reader support
      issues.push(...this.checkScreenReaderSupport(component));

      // Check focus management
      issues.push(...this.checkFocusManagement(component));

      // Check semantic markup
      issues.push(...this.checkSemanticMarkup(component));

      // Calculate score
      const score = this.calculateAccessibilityScore(issues);

      // Generate recommendations
      const recommendations = this.generateRecommendations(issues);

      const audit: AccessibilityAudit = {
        id: `audit-${componentId}-${Date.now()}`,
        componentId,
        componentName,
        auditDate: new Date(),
        wcagLevel: score >= 90 ? 'AAA' : score >= 70 ? 'AA' : 'A',
        issues,
        score,
        recommendations,
        culturalConsiderations: []
      };

      // Save audit results
      await this.saveAccessibilityAudit(audit);

      return audit;
    } catch (error) {
      console.error('Error performing accessibility audit:', error);
      throw error;
    }
  }

  /**
   * Check color contrast compliance
   */
  private checkColorContrast(element: HTMLElement): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // This would implement actual color contrast checking
    // For now, return placeholder issues
    
    return issues;
  }

  /**
   * Check keyboard navigation compliance
   */
  private checkKeyboardNavigation(element: HTMLElement): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for focusable elements without proper tabindex
    const focusableElements = element.querySelectorAll('button, a, input, select, textarea');
    focusableElements.forEach((el, index) => {
      if (!el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '0') {
        // Check if element should be focusable
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') {
          // These should be focusable by default
        } else {
          issues.push({
            id: `keyboard-nav-${index}`,
            type: 'keyboard-navigation',
            severity: 'medium',
            description: 'Interactive element may not be keyboard accessible',
            element: el.tagName.toLowerCase(),
            wcagCriterion: '2.1.1',
            suggestion: 'Add appropriate tabindex or ensure element is keyboard focusable'
          });
        }
      }
    });
    
    return issues;
  }

  /**
   * Check screen reader support
   */
  private checkScreenReaderSupport(element: HTMLElement): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for missing ARIA labels
    const interactiveElements = element.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach((el, index) => {
      const hasLabel = el.hasAttribute('aria-label') || 
                      el.hasAttribute('aria-labelledby') ||
                      el.querySelector('label') ||
                      el.textContent?.trim();
      
      if (!hasLabel) {
        issues.push({
          id: `screen-reader-${index}`,
          type: 'screen-reader',
          severity: 'high',
          description: 'Interactive element lacks accessible name',
          element: el.tagName.toLowerCase(),
          wcagCriterion: '4.1.2',
          suggestion: 'Add aria-label, aria-labelledby, or visible text content'
        });
      }
    });
    
    return issues;
  }

  /**
   * Check focus management
   */
  private checkFocusManagement(element: HTMLElement): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for focus indicators
    const focusableElements = element.querySelectorAll('button, a, input, select, textarea');
    focusableElements.forEach((el, index) => {
      const computedStyle = window.getComputedStyle(el, ':focus');
      const hasVisibleFocus = computedStyle.outline !== 'none' || 
                             computedStyle.boxShadow !== 'none' ||
                             computedStyle.border !== computedStyle.getPropertyValue('border');
      
      if (!hasVisibleFocus) {
        issues.push({
          id: `focus-${index}`,
          type: 'focus-management',
          severity: 'medium',
          description: 'Element lacks visible focus indicator',
          element: el.tagName.toLowerCase(),
          wcagCriterion: '2.4.7',
          suggestion: 'Add visible focus styles using CSS :focus pseudo-class'
        });
      }
    });
    
    return issues;
  }

  /**
   * Check semantic markup
   */
  private checkSemanticMarkup(element: HTMLElement): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for proper heading hierarchy
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        issues.push({
          id: `heading-${index}`,
          type: 'semantic-markup',
          severity: 'medium',
          description: 'Heading hierarchy skips levels',
          element: heading.tagName.toLowerCase(),
          wcagCriterion: '1.3.1',
          suggestion: 'Use proper heading hierarchy (h1, h2, h3, etc.) without skipping levels'
        });
      }
      lastLevel = level;
    });
    
    return issues;
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  /**
   * Generate accessibility recommendations
   */
  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations: string[] = [];
    
    // Group issues by type
    const issuesByType = issues.reduce((acc, issue) => {
      if (!acc[issue.type]) {
        acc[issue.type] = [];
      }
      acc[issue.type].push(issue);
      return acc;
    }, {} as { [key: string]: AccessibilityIssue[] });
    
    // Generate type-specific recommendations
    Object.entries(issuesByType).forEach(([type, typeIssues]) => {
      switch (type) {
        case 'color-contrast':
          recommendations.push('Improve color contrast ratios to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)');
          break;
        case 'keyboard-navigation':
          recommendations.push('Ensure all interactive elements are keyboard accessible and have proper focus management');
          break;
        case 'screen-reader':
          recommendations.push('Add proper ARIA labels and descriptions for screen reader users');
          break;
        case 'focus-management':
          recommendations.push('Implement visible focus indicators and proper focus order');
          break;
        case 'semantic-markup':
          recommendations.push('Use semantic HTML elements and proper heading hierarchy');
          break;
      }
    });
    
    return recommendations;
  }

  /**
   * Save accessibility audit results
   */
  private async saveAccessibilityAudit(audit: AccessibilityAudit): Promise<void> {
    try {
      const { error } = await supabase
        .from('accessibility_audits')
        .insert([
          {
            id: audit.id,
            component_id: audit.componentId,
            component_name: audit.componentName,
            audit_date: audit.auditDate.toISOString(),
            wcag_level: audit.wcagLevel,
            issues: audit.issues,
            score: audit.score,
            recommendations: audit.recommendations,
            cultural_considerations: audit.culturalConsiderations,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        throw error;
      }

      console.log(`Accessibility audit saved: ${audit.id}`);
    } catch (error) {
      console.error('Error saving accessibility audit:', error);
    }
  }

  /**
   * Get accessibility preferences for user
   */
  public getUserPreferences(userId: string): AccessibilityPreferences | null {
    return this.preferences.get(userId) || null;
  }

  /**
   * Check if user has specific accessibility need
   */
  public hasAccessibilityNeed(userId: string, need: keyof AccessibilityPreferences): boolean {
    const preferences = this.preferences.get(userId);
    if (!preferences) return false;
    
    return Boolean(preferences[need]);
  }
}

// Create singleton instance
export const accessibilityService = new AccessibilityService();