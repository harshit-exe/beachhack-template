# UI Design Prompt for Agent Command Center Dashboard
## For Google Stitch / v0 / Bolt / Any UI Generator

---

## 🎨 DESIGN SPECIFICATION

Create a modern, professional agent command center dashboard for a customer support system. The interface should be clean, intuitive, and optimized for real-time customer interactions.

---

## 📐 LAYOUT REQUIREMENTS

### Overall Structure (100vh - Single Screen, No Scrolling)
The dashboard MUST fit entirely within 100vh (viewport height) with NO scrolling. Use these exact height allocations:

```
┌─────────────────────────────────────────────────┐
│ HEADER BAR                              (10vh)  │
├─────────────────────────────────────────────────┤
│ CUSTOMER INFO CARD                      (15vh)  │
├──────────────────┬──────────────────────────────┤
│                  │                              │
│ LIVE             │ AI SUGGESTIONS               │
│ TRANSCRIPTION    │ & RECOMMENDATIONS            │
│ PANEL            │ PANEL                        │
│ (45vh)           │ (45vh)                       │
│                  │                              │
├──────────────────┴──────────────────────────────┤
│ INTERACTION HISTORY                     (20vh)  │
├─────────────────────────────────────────────────┤
│ QUICK ACTIONS BAR                       (10vh)  │
└─────────────────────────────────────────────────┘
```

---

## 🎨 COLOR SCHEME & THEME

### Primary Colors
- **Brand Blue**: `#3B82F6` (Primary actions, headers)
- **Success Green**: `#10B981` (Positive status, resolved)
- **Warning Orange**: `#F59E0B` (Alerts, pending actions)
- **Error Red**: `#EF4444` (Critical issues, escalations)
- **Neutral Gray**: `#6B7280` (Secondary text, borders)

### Background
- **Main Background**: `#F9FAFB` (Light gray)
- **Card Background**: `#FFFFFF` (Pure white)
- **Hover State**: `#F3F4F6`
- **Active State**: `#E5E7EB`

### Text Colors
- **Primary Text**: `#111827` (Almost black)
- **Secondary Text**: `#6B7280` (Medium gray)
- **Muted Text**: `#9CA3AF` (Light gray)

### Border & Shadows
- **Border**: `1px solid #E5E7EB`
- **Card Shadow**: `0 1px 3px rgba(0,0,0,0.1)`
- **Hover Shadow**: `0 4px 6px rgba(0,0,0,0.1)`

---

## 📱 COMPONENT BREAKDOWN

### 1. HEADER BAR (Height: 10vh)
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] ContextHub         🔴 LIVE CALL (00:02:45)          John Doe ▼ │
│                           ┌────────────────────────┐                   │
│                           │ Priya Sharma           │                   │
│                           │ +91-98765-43210        │                   │
│                           └────────────────────────┘                   │
└────────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Logo: Left-aligned, 40px height
- Call Status Indicator: Center, animated red dot when call active
- Call Timer: Real-time counter (MM:SS format)
- Customer Name/Number: Pop-up when hovered
- Agent Profile: Right-aligned dropdown (logout, settings, profile)

**Styling:**
- Background: White
- Bottom border: 2px solid #E5E7EB
- Fixed position (sticky top)
- Z-index: 100

---

### 2. CUSTOMER INFO CARD (Height: 15vh)
```
┌────────────────────────────────────────────────────────────────────────┐
│ 👤                                                                     │
│ Priya Sharma | +91-98765-43210                  🟢 Premium Customer   │
│ Customer ID: #12345 | Since: Jan 2025 | Last Contact: 2 days ago     │
│                                                                        │
│ 📊 3rd call today  |  ⭐ Rating: 4.5/5  |  💰 LTV: ₹45,000           │
│                                                                        │
│ ⚠️  ALERT: Complained about delivery delay in last interaction        │
│ 💡  INSIGHT: Prefers WhatsApp for follow-ups                          │
└────────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Profile Avatar: 60px circle, placeholder with initials if no photo
- Customer Name: Bold, 20px font
- Phone Number: Clickable (triggers dial)
- Status Badge: Pill shape with color coding
  - 🟢 Green: Premium/VIP
  - 🟡 Orange: Active
  - ⚫ Gray: New Customer
  - 🔴 Red: At Risk
- Quick Stats: Icon + Text format, evenly spaced
- Alerts Banner: Orange background (#FEF3C7) with warning icon
- Insights: Light blue background (#DBEAFE) with bulb icon

**Styling:**
- Background: White
- Border: 1px solid #E5E7EB
- Border-radius: 8px
- Padding: 16px
- Margin: 12px (gap from header)
- Box-shadow: 0 1px 3px rgba(0,0,0,0.1)

---

### 3. LIVE TRANSCRIPTION PANEL (Height: 45vh, Width: 50%)
```
┌────────────────────────────────────────────────────────────┐
│ 🎤 Recording... 00:02:45              [⏸️ Pause] [⏹️ Stop] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                            │
│ CUSTOMER [00:00:15]:                                       │
│ "Hi, I'm calling about my order #12345. It was supposed   │
│ to arrive yesterday but I haven't received it yet."       │
│                                                            │
│ AGENT [00:00:35]:                                          │
│ "Hi Priya! I can see your order #12345 here. Let me       │
│ check the delivery status for you right away."            │
│                                                            │
│ CUSTOMER [00:00:52]:                                       │
│ "Thank you. I need it urgently for an event tomorrow."    │
│                                                            │
│ [Typing indicator: Agent is speaking...]                  │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 😊 Sentiment: POSITIVE  |  📈 Trend: ↗️ Improving  │   │
│ └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

**Elements:**
- Recording Indicator: Animated red dot
- Timer: Running counter
- Control Buttons: Pause and Stop
- Audio Waveform: Visual representation of voice (optional)
- Transcription Feed:
  - Auto-scroll to bottom as new text appears
  - Speaker labels (CUSTOMER / AGENT)
  - Timestamps
  - Different background colors for speakers:
    - Customer: Light blue (#EFF6FF)
    - Agent: Light green (#F0FDF4)
- Real-time Typing Indicator
- Sentiment Analysis Bar: Bottom sticky

**Styling:**
- Background: White
- Border: 1px solid #E5E7EB
- Border-radius: 8px
- Padding: 16px
- Max-height: 45vh
- Overflow-y: auto (for transcription content only)
- Smooth scroll behavior

---

### 4. AI SUGGESTIONS PANEL (Height: 45vh, Width: 50%)
```
┌────────────────────────────────────────────────────────────┐
│ 🤖 AI Co-Pilot                              Powered by AI  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                            │
│ ✨ SUGGESTED RESPONSES:                                   │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 1. "I see your order #12345 is delayed by 2 days. │   │
│ │    Would you like us to expedite shipping at no   │   │
│ │    extra cost, or would you prefer a 15% discount │   │
│ │    on your next order?"                           │   │
│ │                                      [Use This ↗] │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 2. "Let me escalate this to our logistics team    │   │
│ │    immediately to prioritize your delivery."      │   │
│ │                                      [Use This ↗] │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 💡 SMART ACTIONS:                                         │
│ • Update order status to "Priority"                       │
│ • Send tracking link via WhatsApp                         │
│ • Schedule follow-up in 4 hours                           │
│                                                            │
│ 📚 KNOWLEDGE BASE:                                        │
│ • [Delivery Policy] Standard Timeline: 3-5 days           │
│ • [Escalation SOP] Steps for urgent deliveries            │
│                                                            │
│ ⚠️  ALERTS:                                               │
│ Customer mentioned "urgently" - High priority             │
└────────────────────────────────────────────────────────────┘
```

**Elements:**
- AI Branding: Top header with icon
- Suggested Responses:
  - Card-based layout
  - Numbered suggestions (1-3)
  - "Use This" button (copies to clipboard or inserts)
  - Confidence indicator (optional)
- Smart Actions:
  - Checkbox list of recommended actions
  - One-click execution
- Knowledge Base Articles:
  - Clickable links to relevant docs
  - Preview on hover
- Alerts Section:
  - Red/orange badges for urgent items
  - Keyword highlights

**Styling:**
- Background: White
- Border: 1px solid #E5E7EB
- Border-radius: 8px
- Padding: 16px
- Suggestion cards:
  - Background: #F9FAFB
  - Border: 1px dashed #D1D5DB
  - Hover: Border becomes solid, shadow appears
- Use buttons:
  - Primary blue background
  - White text
  - Rounded corners (6px)

---

### 5. INTERACTION HISTORY (Height: 20vh)
```
┌────────────────────────────────────────────────────────────────────────┐
│ 📅 PAST INTERACTIONS              [Filter: All ▼] [Search: 🔍______]  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ 📞 CALL • Jan 27, 2025 at 3:45 PM • Duration: 8m 32s            │ │
│ │ Issue: Product inquiry about Premium plan                       │ │
│ │ Agent: John Doe  |  Resolution: ✅ Resolved  |  Rating: ⭐⭐⭐⭐⭐ │ │
│ │ [View Full Transcript]                                           │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ ✉️ EMAIL • Jan 23, 2025 at 11:20 AM                             │ │
│ │ Subject: Question about refund policy                            │ │
│ │ Agent: Sarah Smith  |  Resolution: ✅ Resolved                   │ │
│ │ [View Email Thread]                                              │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ 💬 CHAT • Jan 15, 2025 at 5:10 PM • Duration: 12m               │ │
│ │ Issue: Requested bulk pricing information                        │ │
│ │ Agent: Mike Johnson  |  Resolution: ⏳ Pending                   │ │
│ │ [View Chat Log]                                                  │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Header with Filters:
  - Channel filter: All, Call, Email, Chat, WhatsApp
  - Search box: Full-text search
- Timeline Cards:
  - Icon for channel type (📞 📧 💬 📱)
  - Date and time
  - Duration (for calls/chats)
  - Brief description
  - Agent name
  - Resolution status badge:
    - ✅ Green: Resolved
    - ⏳ Orange: Pending
    - ❌ Red: Escalated
  - Rating stars (if available)
  - Action button: View details
- Horizontal scroll or pagination

**Styling:**
- Background: White
- Border: 1px solid #E5E7EB
- Border-radius: 8px
- Padding: 16px
- Cards:
  - Background: #F9FAFB
  - Margin-bottom: 12px
  - Hover: Slight lift with shadow
  - Cursor: pointer

---

### 6. QUICK ACTIONS BAR (Height: 10vh)
```
┌────────────────────────────────────────────────────────────────────────┐
│ [🎫 Create Ticket]  [📞 Schedule Callback]  [✉️ Send Email]           │
│ [📝 Add Note]  [🏷️ Tag Customer]  [⬆️ Escalate]  [✅ Mark Resolved]   │
└────────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Action Buttons:
  - Icon + Text label
  - Even spacing
  - 2 rows if needed
  - Tooltips on hover
- Common Actions:
  - Create Ticket
  - Schedule Callback
  - Send Email
  - Send WhatsApp
  - Add Note
  - Tag Customer
  - Escalate to Supervisor
  - Mark Resolved
  - Transfer Call

**Styling:**
- Background: White
- Border-top: 2px solid #E5E7EB
- Padding: 16px
- Buttons:
  - Outline style (not filled)
  - Border: 1px solid #D1D5DB
  - Hover: Background #F3F4F6
  - Icon: 20px
  - Padding: 12px 24px
  - Border-radius: 6px
  - Gap: 12px between buttons

---

## 🎯 SPECIAL STATES & INTERACTIONS

### Incoming Call State
When a call comes in, show a modal overlay:

```
┌────────────────────────────────────────────┐
│         📞 INCOMING CALL                   │
│                                            │
│         Priya Sharma                       │
│         +91-98765-43210                    │
│                                            │
│      [Last contact: 2 days ago]            │
│      [Previous issue: Delivery delay]      │
│                                            │
│    [✅ Answer Call]    [❌ Decline]        │
└────────────────────────────────────────────┘
```

**Modal Styling:**
- Center of screen
- White background
- Large shadow
- Animated ring effect
- Sound notification (if browser allows)

---

### New Customer State
If customer is not found in database:

```
┌────────────────────────────────────────────────────────────┐
│ 🆕 NEW CUSTOMER                                           │
│ +91-98765-43210                                            │
│                                                            │
│ [Quick Name Input: ________________]  [Save]             │
│                                                            │
│ AI will automatically capture additional details          │
│ from the conversation.                                     │
└────────────────────────────────────────────────────────────┘
```

---

### Empty State (No Active Call)
When no call is active:

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                   📞                                       │
│                                                            │
│         No active call                                     │
│         Waiting for incoming calls...                      │
│                                                            │
│         Status: 🟢 Online                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 💫 ANIMATIONS & MICRO-INTERACTIONS

1. **Call Status Indicator**: Pulsing animation on red dot
2. **Live Transcription**: Fade-in animation for new messages
3. **AI Suggestions**: Slide-up animation when generated
4. **Buttons**: Scale slightly on hover (transform: scale(1.05))
5. **Loading States**: Skeleton screens or spinner
6. **Sentiment Changes**: Color transition animation
7. **Notifications**: Toast messages in top-right corner

---

## 🔧 RESPONSIVE BEHAVIOR

While primarily designed for desktop (1920x1080+), include these breakpoints:

- **Large Desktop (1920px+)**: Full layout as designed
- **Desktop (1440px+)**: Maintain layout, slightly smaller padding
- **Laptop (1024px+)**: Stack AI panel below transcription
- **Tablet (768px+)**: Single column, collapsible sections
- **Mobile (< 768px)**: Not recommended, show "Desktop Required" message

---

## 📝 TYPOGRAPHY

- **Font Family**: 'Inter', system-ui, -apple-system, sans-serif
- **Heading 1**: 24px, font-weight: 700
- **Heading 2**: 20px, font-weight: 600
- **Heading 3**: 18px, font-weight: 600
- **Body**: 14px, font-weight: 400
- **Small**: 12px, font-weight: 400
- **Line Height**: 1.5

---

## 🎨 ICON LIBRARY

Use **Lucide React** or **Heroicons** for consistency:
- Phone: `Phone`
- Email: `Mail`
- Chat: `MessageCircle`
- WhatsApp: `MessageSquare` with custom color
- Ticket: `Ticket`
- Calendar: `Calendar`
- User: `User`
- Settings: `Settings`
- Alert: `AlertCircle`
- Success: `CheckCircle`
- Warning: `AlertTriangle`

---

## ✅ ACCESSIBILITY REQUIREMENTS

- All interactive elements must be keyboard accessible (Tab navigation)
- ARIA labels for all icons and buttons
- Color contrast ratio minimum 4.5:1 for text
- Focus indicators visible on all interactive elements
- Screen reader friendly structure
- Error messages must be clear and accessible

---

## 🚀 PERFORMANCE CONSIDERATIONS

- Lazy load interaction history
- Virtual scrolling for long transcription logs
- Debounce real-time updates (100ms)
- Optimize re-renders with React.memo
- Use CSS transforms for animations (not position)
- Compress images and icons

---

## 🎬 FINAL PROMPT FOR UI GENERATOR

```
Create a customer support agent dashboard with these exact specifications:

LAYOUT: 100vh single-screen layout with no scrolling
- Header (10vh): Logo, live call indicator, agent profile
- Customer card (15vh): Avatar, name, status, stats, alerts
- Two-column middle section (45vh each):
  - Left: Live transcription with speaker labels and sentiment
  - Right: AI suggestions with response options and smart actions
- History section (20vh): Timeline of past interactions
- Actions bar (10vh): Quick action buttons

STYLE: Modern, clean design with:
- Colors: Blue (#3B82F6), Green (#10B981), Orange (#F59E0B), Red (#EF4444)
- White cards with subtle shadows
- Inter font family
- Rounded corners (8px)
- Smooth animations

COMPONENTS:
- Real-time transcription feed with auto-scroll
- AI suggestion cards with "Use This" buttons
- Interactive history timeline
- Status badges and sentiment indicators
- Quick action button bar

Make it professional, intuitive, and optimized for fast customer service interactions.
```

---

## 📸 REFERENCE IMAGES (If needed)

Inspiration from:
- Zendesk Agent Workspace
- Intercom Inbox
- Freshdesk Agent Console
- Modern SaaS dashboards (Linear, Notion)

---

**This UI should feel:**
- ⚡ Fast and responsive
- 🎯 Purpose-built for agents
- 🧠 Intelligent with AI assistance
- 🎨 Clean and professional
- 💪 Powerful yet simple

---

## END OF UI DESIGN PROMPT