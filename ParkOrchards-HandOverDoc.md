# Admin & Interface Handover Document

Welcome to the administration guide for the Park Orchards Football & Netball Club (POFNC) website. This document will help you understand how to customize page content, edit the layout using **Custom Sections**, and manage the data system (Players, Sponsors, Teams, Policies...) easily and consistently.

---

## 2. Theme Management via Theme Editor

The website interface is modular. This means you can easily add, remove, or move sections on a page visually without knowing how to code.

### How to access and edit

1. Log in to Shopify Admin.
2. Navigate to **Online Store > Themes**.
3. Click the **Customize** button on the current "Live" theme.
4. Use the top dropdown menu to navigate between pages (e.g., Home page, Sponsor page, Players page...).
5. The left column lists the **Sections**. Click on a Section to open its settings in the right column.

> [SCREENSHOT: Insert image of Shopify Theme Editor, highlighting the left column (Theme blocks) and right column (Settings)]

### Key Custom Sections in the System

The system provides a variety of sections specifically designed for POFNC. You can add them to any page by clicking **Add section**.

*   **Hero Banner / Netball Hero:** Large top-of-page banner, capable of containing images, video (optional), main title, description, and Call to Action buttons. Supports text alignment and overlays to improve text readability.
*   **Players Tabs Directory:** A list of players automatically pulled from Metaobjects data, categorized by tabs, with built-in filters (Team, Grade, Sport).
*   **Sponsors Page & Sponsor Slider:** Area displaying sponsor logos. Designed as an auto-slider or a grid categorized by sponsorship tier (Gold, Silver...).
*   **Club People / Committee Personnel:** Dedicated section displaying the coaching staff and club committee members.
*   **Sponsorship Packages:** Displays sponsorship packages as stacked cards. Content is dynamically fetched from the `sponsorship_package` metaobject.
*   **Policies Tabs:** Displays club rules and policies automatically split into readable horizontal or vertical tabs.

**Tip:** Most data in these Sections (Players, Sponsors, Policies, Packages) is **Dynamic**. You don't add each person/item individually in the Theme Editor. You just drop the section onto the page, and the content is automatically pulled from the **Content > Metaobjects** section in the Admin.

---

## 3. Metaobjects & Metafields Data Structure

For the website to function smartly, avoiding rigid data entry, we utilized Shopify's **Metaobjects**. Think of Metaobjects as database tables used to store structured information.

Access **Shopify Admin > Content > Metaobjects** to manage all this data.

> [SCREENSHOT: Insert image of the Content > Metaobjects area in Shopify Admin]

### 3.1. Term Metaobjects (Categorization)

These are categories used to classify main data. You should create these categories first.

| Metaobject Type       | Description & Examples                                       |
| :-------------------- | :----------------------------------------------------------- |
| **Club Sport**        | Sport type: `Football`, `Netball`...                         |
| **Club Division**     | Division: `Men`, `Women`...                                  |
| **Club Grade**        | Competition Grade: `Under 19`, `Seniors`, `Reserves`...      |
| **Sponsor Tier**      | Sponsorship Tier: `Gold`, `Silver`, `Community Partner`...   |
| **Club People Group** | Committee group: `Committee`, `Coaches`, `Volunteers`...     |

### 3.2. Main Metaobjects (Core Data)

These are the primary entities on the site. When you add data here, it will automatically reflect on the front-end interface.

*   **Club Teams:** The backbone of the system. *Example: Men Football Seniors.* Each team contains sport info, grade, PlayHQ link, and the team cover image.
*   **Player Profiles:** Contains full name, jersey number, photo, and specifically a REFERENCE pointing to a "Club Team".
*   **Club Sponsors:** Contains Logo, website, and a reference pointing to a "Sponsor Tier" (to know their ranking). It also includes a feature to link a Sponsor to one or more Player entries (Player Sponsor).
*   **Club Policy:** Storage for organization rules. Contains Title and Rich Text content.
*   **Sponsorship Packages:** Where sponsorship package benefits are created. Changing prices or updating benefits will instantly reflect on the sponsorship page.

---

## 4. Daily Content Entry Guide

### 4.1. How to Add a New Player

The exact process for entering a player to avoid display issues:

1.  **Step 1:** Ensure the **Club Team** already exists. If a player belongs to "Women Netball Seniors" but this Team hasn't been created, go to `Content > Metaobjects > Club Teams` to create the team first.
2.  **Step 2:** Go to `Content > Metaobjects > Player Profiles` and click **Add entry**.
3.  **Step 3:** Enter information: Full name, Jersey number, Profile photo.
4.  **Step 4 (CRUCIAL):** In the **Team** section, click "Select" and choose the corresponding Team. The system uses this Team info to intelligently categorize them on the player directory page.
5.  **Step 5:** Ensure you toggle the Status switch to **Active** right next to the save button. (If left as Draft, the player won't appear on the website). Click Save.

> [SCREENSHOT: Editing a Player, highlight the "Team" selection area and the Active status button]

### 4.2. How to Add a Sponsor

A sponsor can be a Club sponsor or a Player sponsor.

1.  Go to `Content > Metaobjects > Club Sponsors` > Add entry.
2.  Enter Sponsor name and upload the Logo.
3.  Select **Scope** (Is it a "Club Sponsor" or "Player Sponsor").
4.  Select **Tier** (Level: Gold, Silver...).
5.  **Player Sponsorship:** If this is a "Player Sponsor", scroll down to the *Sponsored player* field and select one or more players that sponsor is supporting. The system will automatically link them as a list.
6.  Select Status: Active and click save.

**Important:** Before doing any large sponsor/player cleanup, run the audit backup script first so you have a JSON snapshot of the current relationships.

### 4.3. Editing Policies and Sponsorship Packages

This is very simple; navigate to `Content > Metaobjects > Club Policy` (or Sponsorship Packages). Click edit on the text. You can insert links, bold text, or upload PDF files directly into the Rich text editor box. Everything will automatically appear on the site in the order of the **Sort Order** field.

**General Rule for Sorting (Sort Order):** Most Metaobjects have a `Sort order` field (number input). The website prioritizes display from smallest to largest number (0, 1, 2, 3...). You can adjust this to push specific players or sponsors to the top.

---

## 5. News & Events Management

We have configured a separated setup into 2 distinct Shopify Blogs for easy organization.

Access **Online Store > Blog posts**

*   **Posting News:** When creating a post (Article), carefully look at the right sidebar under the *Blog* section, and select **News**. Write your title, body content, and upload a Featured Cover image normally.
*   **Posting Events:** Select the Blog as **Events**.
    For events, alongside regular text content, scroll down to the bottom of the screen where you'll find the **Metafields** section. Here you input the exact Start datetime, End datetime, Venue, Button Label for ticket purchasing, and the External link to the event registration.

> [SCREENSHOT: Event article scrolled down to the bottom showing input boxes for time, venue, and attached links]

The system automatically uses a separate Template for Events to highlight the time and registration button on the interface without you needing to edit any code.

---

*This document is compiled for the system features handover process. If you encounter any queries during operation, please carefully review the notes in the highlight boxes.*
