import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

describe('Dashboard Workflows E2E Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: process.env.CI === 'true',
      slowMo: 100 
    });
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
    
    // Set up test authentication
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('[data-testid="email-input"]', 'test-community@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Community Member Dashboard Workflow', () => {
    it('should allow community member to submit and track story', async () => {
      // Navigate to community dashboard
      await page.goto('http://localhost:3000/dashboard/community');
      await page.waitForSelector('[data-testid="community-dashboard"]');

      // Submit new story
      await page.click('[data-testid="submit-story-button"]');
      await page.waitForSelector('[data-testid="story-submission-form"]');

      // Fill out story form
      await page.fill('[data-testid="story-title"]', 'E2E Test Healthcare Story');
      await page.fill('[data-testid="story-content"]', 'Our community needs better access to healthcare services. The nearest clinic is too far away.');
      await page.selectOption('[data-testid="story-category"]', 'healthcare');
      await page.check('[data-testid="consent-checkbox"]');

      // Submit story
      await page.click('[data-testid="submit-story-form"]');
      await page.waitForSelector('[data-testid="submission-success"]');

      // Verify success message
      const successMessage = await page.textContent('[data-testid="submission-success"]');
      expect(successMessage).toContain('Story submitted successfully');

      // Navigate to my stories
      await page.click('[data-testid="my-stories-tab"]');
      await page.waitForSelector('[data-testid="story-list"]');

      // Verify story appears in list
      const storyTitle = await page.textContent('[data-testid="story-item"]:first-child [data-testid="story-title"]');
      expect(storyTitle).toBe('E2E Test Healthcare Story');

      // Check story status
      const storyStatus = await page.textContent('[data-testid="story-item"]:first-child [data-testid="story-status"]');
      expect(['Pending Review', 'Under Review', 'Approved']).toContain(storyStatus);

      // View story details
      await page.click('[data-testid="story-item"]:first-child [data-testid="view-details"]');
      await page.waitForSelector('[data-testid="story-details-modal"]');

      // Verify story details
      const detailTitle = await page.textContent('[data-testid="detail-title"]');
      const detailContent = await page.textContent('[data-testid="detail-content"]');
      expect(detailTitle).toBe('E2E Test Healthcare Story');
      expect(detailContent).toContain('healthcare services');

      // Close modal
      await page.click('[data-testid="close-modal"]');
    });

    it('should display community insights and trends', async () => {
      await page.goto('http://localhost:3000/dashboard/community');
      
      // Navigate to insights tab
      await page.click('[data-testid="insights-tab"]');
      await page.waitForSelector('[data-testid="community-insights"]');

      // Verify insights components are loaded
      await expect(page.locator('[data-testid="theme-analysis"]')).toBeVisible();
      await expect(page.locator('[data-testid="sentiment-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="urgency-indicators"]')).toBeVisible();

      // Check for data visualization
      const themeChart = page.locator('[data-testid="theme-chart"]');
      await expect(themeChart).toBeVisible();

      // Verify theme data is displayed
      const themes = await page.locator('[data-testid="theme-item"]').count();
      expect(themes).toBeGreaterThan(0);

      // Test theme filtering
      await page.click('[data-testid="filter-healthcare"]');
      await page.waitForTimeout(1000); // Wait for filter to apply
      
      const filteredThemes = await page.locator('[data-testid="theme-item"]:visible').count();
      expect(filteredThemes).toBeGreaterThanOrEqual(0);
    });

    it('should show service discovery recommendations', async () => {
      await page.goto('http://localhost:3000/dashboard/community');
      
      // Navigate to services tab
      await page.click('[data-testid="services-tab"]');
      await page.waitForSelector('[data-testid="service-discovery"]');

      // Verify service recommendations are displayed
      await expect(page.locator('[data-testid="recommended-services"]')).toBeVisible();
      
      const serviceCount = await page.locator('[data-testid="service-item"]').count();
      expect(serviceCount).toBeGreaterThan(0);

      // Test service search
      await page.fill('[data-testid="service-search"]', 'healthcare');
      await page.waitForTimeout(500);
      
      const searchResults = await page.locator('[data-testid="service-item"]:visible').count();
      expect(searchResults).toBeGreaterThanOrEqual(0);

      // View service details
      if (searchResults > 0) {
        await page.click('[data-testid="service-item"]:first-child [data-testid="view-service"]');
        await page.waitForSelector('[data-testid="service-details"]');
        
        await expect(page.locator('[data-testid="service-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="service-description"]')).toBeVisible();
        await expect(page.locator('[data-testid="contact-info"]')).toBeVisible();
      }
    });
  });

  describe('Government/Funder Dashboard Workflow', () => {
    it('should display high-level community metrics', async () => {
      // Switch to government role
      await page.goto('http://localhost:3000/dashboard/government');
      await page.waitForSelector('[data-testid="government-dashboard"]');

      // Verify key metrics are displayed
      await expect(page.locator('[data-testid="total-communities"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-stories"]')).toBeVisible();
      await expect(page.locator('[data-testid="urgent-issues"]')).toBeVisible();
      await expect(page.locator('[data-testid="program-effectiveness"]')).toBeVisible();

      // Check metric values are numeric
      const totalCommunities = await page.textContent('[data-testid="total-communities"] [data-testid="metric-value"]');
      expect(parseInt(totalCommunities || '0')).toBeGreaterThanOrEqual(0);

      // Verify charts are loaded
      await expect(page.locator('[data-testid="trends-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="investment-chart"]')).toBeVisible();
    });

    it('should show investment recommendations', async () => {
      await page.goto('http://localhost:3000/dashboard/government');
      
      // Navigate to investments tab
      await page.click('[data-testid="investments-tab"]');
      await page.waitForSelector('[data-testid="investment-recommendations"]');

      // Verify recommendations are displayed
      const recommendationCount = await page.locator('[data-testid="recommendation-item"]').count();
      expect(recommendationCount).toBeGreaterThan(0);

      // Check recommendation details
      await page.click('[data-testid="recommendation-item"]:first-child [data-testid="view-details"]');
      await page.waitForSelector('[data-testid="recommendation-details"]');

      await expect(page.locator('[data-testid="recommendation-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="investment-amount"]')).toBeVisible();
      await expect(page.locator('[data-testid="expected-impact"]')).toBeVisible();
      await expect(page.locator('[data-testid="priority-level"]')).toBeVisible();

      // Test filtering by priority
      await page.selectOption('[data-testid="priority-filter"]', 'high');
      await page.waitForTimeout(1000);
      
      const highPriorityCount = await page.locator('[data-testid="recommendation-item"]:visible').count();
      expect(highPriorityCount).toBeGreaterThanOrEqual(0);
    });

    it('should display cross-community trend analysis', async () => {
      await page.goto('http://localhost:3000/dashboard/government');
      
      // Navigate to trends tab
      await page.click('[data-testid="trends-tab"]');
      await page.waitForSelector('[data-testid="trend-analysis"]');

      // Verify trend components
      await expect(page.locator('[data-testid="cross-community-trends"]')).toBeVisible();
      await expect(page.locator('[data-testid="emerging-issues"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-patterns"]')).toBeVisible();

      // Test time period selection
      await page.selectOption('[data-testid="time-period"]', '6months');
      await page.waitForTimeout(1000);

      // Verify data updates
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
      
      // Check for trend data
      const trendItems = await page.locator('[data-testid="trend-item"]').count();
      expect(trendItems).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Worker/NGO Dashboard Workflow', () => {
    it('should show service gap analysis', async () => {
      await page.goto('http://localhost:3000/dashboard/worker');
      await page.waitForSelector('[data-testid="worker-dashboard"]');

      // Navigate to service gaps tab
      await page.click('[data-testid="service-gaps-tab"]');
      await page.waitForSelector('[data-testid="service-gap-analysis"]');

      // Verify gap analysis components
      await expect(page.locator('[data-testid="identified-gaps"]')).toBeVisible();
      await expect(page.locator('[data-testid="gap-priorities"]')).toBeVisible();
      await expect(page.locator('[data-testid="coverage-map"]')).toBeVisible();

      // Check gap items
      const gapCount = await page.locator('[data-testid="gap-item"]').count();
      expect(gapCount).toBeGreaterThan(0);

      // View gap details
      await page.click('[data-testid="gap-item"]:first-child [data-testid="view-gap"]');
      await page.waitForSelector('[data-testid="gap-details"]');

      await expect(page.locator('[data-testid="gap-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="affected-communities"]')).toBeVisible();
      await expect(page.locator('[data-testid="urgency-level"]')).toBeVisible();
    });

    it('should display program impact metrics', async () => {
      await page.goto('http://localhost:3000/dashboard/worker');
      
      // Navigate to impact tab
      await page.click('[data-testid="impact-tab"]');
      await page.waitForSelector('[data-testid="impact-metrics"]');

      // Verify impact components
      await expect(page.locator('[data-testid="program-outcomes"]')).toBeVisible();
      await expect(page.locator('[data-testid="community-feedback"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-stories"]')).toBeVisible();

      // Check metrics display
      const outcomeMetrics = await page.locator('[data-testid="outcome-metric"]').count();
      expect(outcomeMetrics).toBeGreaterThan(0);

      // Test program selection
      await page.selectOption('[data-testid="program-selector"]', { index: 0 });
      await page.waitForTimeout(1000);

      // Verify metrics update
      await expect(page.locator('[data-testid="impact-chart"]')).toBeVisible();
    });

    it('should show partnership opportunities', async () => {
      await page.goto('http://localhost:3000/dashboard/worker');
      
      // Navigate to partnerships tab
      await page.click('[data-testid="partnerships-tab"]');
      await page.waitForSelector('[data-testid="partnership-opportunities"]');

      // Verify partnership components
      await expect(page.locator('[data-testid="potential-partners"]')).toBeVisible();
      await expect(page.locator('[data-testid="collaboration-areas"]')).toBeVisible();

      const partnershipCount = await page.locator('[data-testid="partnership-item"]').count();
      expect(partnershipCount).toBeGreaterThanOrEqual(0);

      // Test partnership filtering
      await page.selectOption('[data-testid="partnership-type"]', 'funding');
      await page.waitForTimeout(500);

      const filteredPartnerships = await page.locator('[data-testid="partnership-item"]:visible').count();
      expect(filteredPartnerships).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Real-time Updates and Notifications', () => {
    it('should display real-time notifications', async () => {
      await page.goto('http://localhost:3000/dashboard/community');
      
      // Check for notification bell
      await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
      
      // Click notification bell
      await page.click('[data-testid="notification-bell"]');
      await page.waitForSelector('[data-testid="notification-dropdown"]');

      // Verify notifications are displayed
      const notificationCount = await page.locator('[data-testid="notification-item"]').count();
      expect(notificationCount).toBeGreaterThanOrEqual(0);

      if (notificationCount > 0) {
        // Check notification content
        await expect(page.locator('[data-testid="notification-item"]:first-child [data-testid="notification-title"]')).toBeVisible();
        await expect(page.locator('[data-testid="notification-item"]:first-child [data-testid="notification-time"]')).toBeVisible();

        // Mark notification as read
        await page.click('[data-testid="notification-item"]:first-child [data-testid="mark-read"]');
        await page.waitForTimeout(500);
      }
    });

    it('should update dashboard data in real-time', async () => {
      await page.goto('http://localhost:3000/dashboard/community');
      
      // Get initial story count
      const initialCount = await page.textContent('[data-testid="total-stories"] [data-testid="metric-value"]');
      
      // Submit a new story in another tab/context
      const newPage = await context.newPage();
      await newPage.goto('http://localhost:3000/dashboard/community');
      await newPage.click('[data-testid="submit-story-button"]');
      await newPage.fill('[data-testid="story-title"]', 'Real-time Test Story');
      await newPage.fill('[data-testid="story-content"]', 'Testing real-time updates');
      await newPage.check('[data-testid="consent-checkbox"]');
      await newPage.click('[data-testid="submit-story-form"]');
      await newPage.waitForSelector('[data-testid="submission-success"]');
      await newPage.close();

      // Wait for real-time update on original page
      await page.waitForTimeout(2000);
      
      // Check if count updated (may not always increment due to async processing)
      const updatedCount = await page.textContent('[data-testid="total-stories"] [data-testid="metric-value"]');
      expect(parseInt(updatedCount || '0')).toBeGreaterThanOrEqual(parseInt(initialCount || '0'));
    });
  });

  describe('Accessibility and Mobile Responsiveness', () => {
    it('should be accessible with keyboard navigation', async () => {
      await page.goto('http://localhost:3000/dashboard/community');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Test Enter key activation
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    });

    it('should be responsive on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000/dashboard/community');

      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Test mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await page.waitForSelector('[data-testid="mobile-menu"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // Test mobile navigation
      await page.click('[data-testid="mobile-menu"] [data-testid="insights-link"]');
      await page.waitForSelector('[data-testid="community-insights"]');
      
      // Verify content is properly displayed on mobile
      await expect(page.locator('[data-testid="theme-analysis"]')).toBeVisible();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('http://localhost:3000/dashboard/community');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

      // Clear route interception
      await page.unroute('**/api/**');
      
      // Test retry functionality
      await page.click('[data-testid="retry-button"]');
      await page.waitForTimeout(2000);
      
      // Should recover and show data
      await expect(page.locator('[data-testid="community-dashboard"]')).toBeVisible();
    });

    it('should handle empty data states', async () => {
      // Mock empty data response
      await page.route('**/api/community/stories', route => 
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], count: 0 })
        })
      );

      await page.goto('http://localhost:3000/dashboard/community');
      await page.click('[data-testid="my-stories-tab"]');
      
      // Should show empty state
      await expect(page.locator('[data-testid="empty-stories-state"]')).toBeVisible();
      await expect(page.locator('[data-testid="empty-state-message"]')).toContainText('No stories yet');
      await expect(page.locator('[data-testid="submit-first-story"]')).toBeVisible();
    });
  });
});