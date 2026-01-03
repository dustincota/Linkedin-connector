import { chromium, Browser, Page, BrowserContext } from 'playwright';
import type { Logger } from 'winston';
import * as behavior from './human-behavior';

export interface LinkedInCredentials {
  email: string;
  password: string;
}

export interface LinkedInMessage {
  conversationId: string;
  messageId: string;
  from: string;
  message: string;
  timestamp: Date;
}

export interface LinkedInConversation {
  conversationId: string;
  participant: {
    name: string;
    profileUrl: string;
    imageUrl?: string;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unread: boolean;
}

export class LinkedInService {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private logger: Logger;
  private credentials: LinkedInCredentials;
  private isAuthenticated = false;

  constructor(credentials: LinkedInCredentials, logger: Logger) {
    this.credentials = credentials;
    this.logger = logger;
  }

  /**
   * Initialize browser with persistent context
   */
  async initialize() {
    this.logger.info('Initializing LinkedIn browser service');

    this.browser = await chromium.launch({
      headless: true, // Set to false for debugging
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    // Use persistent context to maintain session
    this.context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
    });

    this.page = await this.context.newPage();

    // Remove automation indicators
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    this.logger.info('LinkedIn browser initialized');
  }

  /**
   * Login to LinkedIn
   */
  async login() {
    if (!this.page) throw new Error('Browser not initialized');

    this.logger.info('Logging in to LinkedIn');

    await this.page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle' });
    await behavior.shortPause();

    // Type email with human-like behavior
    await this.humanType(this.page, '#username', this.credentials.email);
    await behavior.sleep(500);

    // Type password
    await this.humanType(this.page, '#password', this.credentials.password);
    await behavior.sleep(800);

    // Click login button
    await this.page.click('button[type="submit"]');
    await this.page.waitForNavigation({ waitUntil: 'networkidle' });

    // Verify login
    const isLoggedIn = await this.page
      .locator('nav.global-nav')
      .isVisible()
      .catch(() => false);

    if (!isLoggedIn) {
      throw new Error('LinkedIn login failed');
    }

    this.isAuthenticated = true;
    this.logger.info('Successfully logged in to LinkedIn');
  }

  /**
   * Type text with human-like variable speed
   */
  private async humanType(page: Page, selector: string, text: string) {
    const element = await page.locator(selector);
    await element.click();
    await behavior.shortPause();

    for (const char of text) {
      await element.type(char);
      await behavior.sleep(behavior.getTypingDelay(), 10);
    }
  }

  /**
   * Get all conversations from inbox
   */
  async getConversations(): Promise<LinkedInConversation[]> {
    if (!this.page) throw new Error('Browser not initialized');
    if (!this.isAuthenticated) await this.login();

    this.logger.info('Fetching LinkedIn conversations');

    await this.page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'networkidle' });
    await behavior.sleep(2000);

    // Scroll to load more conversations
    await this.randomScroll();

    const conversations: LinkedInConversation[] = [];

    // Extract conversation data
    const conversationElements = await this.page.locator('.msg-conversation-listitem').all();

    for (const element of conversationElements) {
      try {
        const conversationId =
          (await element.getAttribute('data-conversation-id')) || '';

        const nameElement = await element.locator('.msg-conversation-listitem__participant-names');
        const name = (await nameElement.textContent()) || '';

        const profileLink = await element.locator('a').first().getAttribute('href');
        const profileUrl = profileLink ? `https://www.linkedin.com${profileLink}` : '';

        const imageElement = await element.locator('img').first();
        const imageUrl = (await imageElement.getAttribute('src')) || undefined;

        const lastMessageElement = await element.locator('.msg-conversation-listitem__message-snippet');
        const lastMessage = (await lastMessageElement.textContent()) || '';

        const timeElement = await element.locator('time');
        const timeStr = (await timeElement.getAttribute('datetime')) || '';
        const lastMessageTime = timeStr ? new Date(timeStr) : new Date();

        const isUnread = await element.locator('.msg-conversation-listitem--unread').isVisible().catch(() => false);

        conversations.push({
          conversationId,
          participant: {
            name: name.trim(),
            profileUrl,
            imageUrl,
          },
          lastMessage: lastMessage.trim(),
          lastMessageTime,
          unread: isUnread,
        });
      } catch (error: any) {
        this.logger.warn('Failed to parse conversation', { error: error.message });
      }
    }

    this.logger.info(`Found ${conversations.length} conversations`);
    return conversations;
  }

  /**
   * Get messages from a specific conversation
   */
  async getMessages(conversationId: string): Promise<LinkedInMessage[]> {
    if (!this.page) throw new Error('Browser not initialized');
    if (!this.isAuthenticated) await this.login();

    this.logger.info('Fetching messages for conversation', { conversationId });

    // Click on conversation
    await this.page.click(`[data-conversation-id="${conversationId}"]`);
    await behavior.sleep(1500);

    // Scroll to load all messages
    const messageThread = await this.page.locator('.msg-s-message-list-container');
    await messageThread.scrollIntoViewIfNeeded();
    await behavior.sleep(1000);

    const messages: LinkedInMessage[] = [];
    const messageElements = await this.page.locator('.msg-s-event-listitem').all();

    for (const element of messageElements) {
      try {
        const messageId = (await element.getAttribute('data-event-urn')) || '';

        const senderElement = await element.locator('.msg-s-message-group__name');
        const from = (await senderElement.textContent()) || '';

        const messageElement = await element.locator('.msg-s-event-listitem__body');
        const message = (await messageElement.textContent()) || '';

        const timeElement = await element.locator('time');
        const timeStr = (await timeElement.getAttribute('datetime')) || '';
        const timestamp = timeStr ? new Date(timeStr) : new Date();

        messages.push({
          conversationId,
          messageId,
          from: from.trim(),
          message: message.trim(),
          timestamp,
        });
      } catch (error: any) {
        this.logger.warn('Failed to parse message', { error: error.message });
      }
    }

    return messages;
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(conversationId: string, message: string) {
    if (!this.page) throw new Error('Browser not initialized');
    if (!this.isAuthenticated) await this.login();

    this.logger.info('Sending message', { conversationId, messageLength: message.length });

    // Navigate to conversation
    await this.page.goto(`https://www.linkedin.com/messaging/thread/${conversationId}/`, {
      waitUntil: 'networkidle',
    });
    await behavior.sleep(1500);

    // Find message input
    const messageBox = await this.page.locator('.msg-form__contenteditable');
    await messageBox.click();
    await behavior.shortPause();

    // Type message with human-like behavior
    for (const char of message) {
      await messageBox.type(char);
      await behavior.sleep(behavior.getTypingDelay(), 10);
    }

    await behavior.sleep(1000);

    // Send message
    await this.page.click('.msg-form__send-button');
    await behavior.sleep(1500);

    this.logger.info('Message sent successfully');
  }

  /**
   * Send connection request
   */
  async sendConnectionRequest(profileUrl: string, note?: string) {
    if (!this.page) throw new Error('Browser not initialized');
    if (!this.isAuthenticated) await this.login();

    this.logger.info('Sending connection request', { profileUrl });

    await this.page.goto(profileUrl, { waitUntil: 'networkidle' });
    await behavior.sleep(2000);

    // Random scroll to appear human
    await this.randomScroll();
    await behavior.shortPause();

    // Click Connect button
    const connectButton = await this.page.locator('button:has-text("Connect")').first();
    await connectButton.click();
    await behavior.sleep(1000);

    // Add note if provided
    if (note) {
      const addNoteButton = await this.page.locator('button:has-text("Add a note")');
      const isVisible = await addNoteButton.isVisible().catch(() => false);

      if (isVisible) {
        await addNoteButton.click();
        await behavior.sleep(500);

        const noteTextarea = await this.page.locator('#custom-message');
        await this.humanType(this.page, '#custom-message', note);
        await behavior.sleep(800);
      }
    }

    // Send connection request
    const sendButton = await this.page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await behavior.sleep(1500);

    this.logger.info('Connection request sent successfully');
  }

  /**
   * Random scroll to appear human
   */
  private async randomScroll() {
    if (!this.page) return;

    const scrollAmount = behavior.getRandomScrollAmount();
    await this.page.mouse.wheel(0, scrollAmount);
    await behavior.sleep(500);
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.logger.info('LinkedIn browser closed');
    }
  }

  /**
   * Check if within working hours
   */
  isWithinWorkingHours(
    workingHoursStart: string = '09:00',
    workingHoursEnd: string = '17:00',
    workingDays: number[] = [1, 2, 3, 4, 5]
  ): boolean {
    return behavior.isWithinWorkingHours(workingHoursStart, workingHoursEnd, workingDays);
  }
}
