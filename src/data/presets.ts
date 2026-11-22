import { DocumentPreset } from "../types";

export const DOCUMENT_PRESETS: DocumentPreset[] = [
  {
    id: "startup-offer",
    label: "Startup Equity Offer",
    documentType: "Startup Employment & Equity Offer",
    summaryHint: "4-year vesting, 90-day exercise window, broad side-project IP assignment",
    rawText: `OFFER OF EMPLOYMENT — NORTHSTAR LABS INC.

1. Compensation & Equity Grant
Your base salary will be $148,000 per year, payable semi-monthly. Subject to Board approval, you will receive an option to purchase 45,000 shares of Common Stock vesting over four (4) years, with 25% vesting on the one-year anniversary of your start date and 1/48th monthly thereafter. Upon any termination of service, vested options must be exercised within ninety (90) days or they will automatically expire and return to the pool.

2. Proprietary Information & Side Projects
As a condition of employment, Employee assigns to Company all right, title, and interest in any inventions, software, designs, or prototypes conceived or reduced to practice during the period of employment, whether on or off Company premises, and whether or not related to Company's current business, unless explicitly excluded in writing on Exhibit A prior to start date.

3. Acceleration & Change of Control
In the event of a Change of Control, unvested shares shall continue on their original vesting schedule unless the acquiring entity declines to assume the option grant, in which case vesting acceleration remains solely at the Board's discretion.

4. At-Will Employment & Arbitration
Your employment is at-will and may be terminated by either party at any time with or without cause. Any dispute arising out of this offer shall be resolved through binding individual arbitration in Santa Clara County, California.`,
    initialAnalysis: {
      documentType: "Startup Employment & Equity Offer",
      summary:
        "Standard base salary and 4-year equity vesting schedule, paired with two restrictive clauses covering post-departure option expiration and broad off-hours invention ownership. The company retains full discretion on acquisition acceleration.",
      bottomLine:
        "Before signing, list your existing weekend/hackathon projects on Exhibit A and request a longer post-termination exercise window.",
      findings: [
        {
          id: "preset-offer-1",
          exactQuote:
            "Upon any termination of service, vested options must be exercised within ninety (90) days or they will automatically expire and return to the pool.",
          severity: "critical",
          category: "Exercise Window",
          title: "90-day post-termination option expiration",
          plainEnglish:
            "If you leave or are laid off, you have only 90 days to pay cash to buy your vested shares—and potentially owe taxes immediately—or forfeit every share you earned.",
          impact: "High out-of-pocket cash risk or total loss of vested equity",
          suggestedAsk:
            "Ask for an extended post-termination exercise window of 3 to 7 years (or at least 12 months if terminated without cause).",
        },
        {
          id: "preset-offer-2",
          exactQuote:
            "Employee assigns to Company all right, title, and interest in any inventions, software, designs, or prototypes conceived or reduced to practice during the period of employment, whether on or off Company premises, and whether or not related to Company's current business",
          severity: "critical",
          category: "IP Assignment",
          title: "Company claims off-hours side projects",
          plainEnglish:
            "Even if you build a weekend tool on your personal laptop with zero company resources, this phrasing gives the company ownership unless excluded upfront.",
          impact: "Loss of personal hackathon, open-source, or weekend project IP",
          suggestedAsk:
            "Request statutory carve-out language (e.g., California Labor Code §2870) excluding work done on your own time without company equipment, plus list active projects on Exhibit A.",
        },
        {
          id: "preset-offer-3",
          exactQuote:
            "unless the acquiring entity declines to assume the option grant, in which case vesting acceleration remains solely at the Board's discretion.",
          severity: "watch",
          category: "Change of Control",
          title: "No guaranteed double-trigger acceleration",
          plainEnglish:
            "If the startup is acquired and the new owner lets you go shortly after, your unvested equity is not automatically protected.",
          impact: "Unvested shares could be wiped out post-acquisition",
          suggestedAsk:
            "Ask whether senior or standard grants include double-trigger acceleration (e.g., 50%–100% vesting if terminated without cause within 12 months of an acquisition).",
        },
        {
          id: "preset-offer-4",
          exactQuote:
            "25% vesting on the one-year anniversary of your start date and 1/48th monthly thereafter.",
          severity: "fair",
          category: "Vesting Schedule",
          title: "Standard 4-year vesting with 1-year cliff",
          plainEnglish:
            "You earn zero equity during your first 12 months, unlock 25% at month 12, and vest monthly for the remaining 3 years.",
          impact: "Market-standard startup vesting cadence",
          suggestedAsk:
            "No change needed unless you are forfeiting unvested equity elsewhere and want a signing bonus.",
        },
      ],
    },
  },
  {
    id: "apartment-lease",
    label: "Apartment Lease",
    documentType: "Residential Lease Agreement",
    summaryHint: "Auto-renewal notice trap, $5,800 break fee, 14-day repair waiver",
    rawText: `RESIDENTIAL LEASE ADDENDUM — BAYVIEW TERRACE APARTMENTS

Section 4. Term & Automatic Renewal
The initial lease term is twelve (12) months at $2,900 per month. Unless Tenant delivers written notice via certified mail at least sixty (60) days prior to expiration, this Agreement automatically renews for a full additional twelve (12) month term at Landlord's then-current market renewal rate, which may increase up to 9.5%.

Section 9. Early Termination
Should Tenant vacate before the end of any term, Tenant remains liable for all remaining monthly rent through the end of the term, plus a non-refundable $1,450 re-leasing administrative fee, regardless of when a replacement tenant occupies the unit.

Section 12. Maintenance & Habitability Credits
Landlord shall use reasonable efforts to address non-emergency maintenance requests. Tenant waives any right to rent abatement or repair-and-deduct remedies unless a critical utility outage persists beyond fourteen (14) consecutive business days after written notice.

Section 15. Security Deposit Return
Tenant's $2,900 security deposit shall be itemized and refunded within twenty-one (21) days of key return, less documented damage beyond ordinary wear and tear.`,
  },
  {
    id: "freelance-scope",
    label: "Freelance Scope",
    documentType: "Independent Contractor Services Agreement",
    summaryHint: "Unlimited revisions, Net-60 after client sign-off, broad indemnity",
    rawText: `MASTER CONTRACTOR AGREEMENT — BRIGHTLINE STUDIO

3. Deliverables & Revisions
Contractor shall deliver the complete web application prototype by December 12, 2026. Fee is fixed at $6,500. Contractor agrees to perform unlimited revisions and refinements requested by Client until Client provides written Final Acceptance in its sole discretion.

5. Payment Timing
Client shall pay Contractor within sixty (60) days following Client's written Final Acceptance and receipt of an undisputed invoice. Client may withhold payment for any milestone deemed unsatisfactory without owing partial compensation for hours worked.

8. Intellectual Property & Portfolio Rights
All work product becomes Client's exclusive property upon creation, prior to payment. Contractor may not display screenshots, architecture notes, or descriptions of the project in any portfolio or demo reel without prior written consent.

11. Indemnification
Contractor agrees to indemnify and hold Client harmless from any third-party claim, legal fee, or damages arising out of Contractor's work product, without limitation of liability.`,
  },
  {
    id: "saas-terms",
    label: "SaaS Auto-Renewal",
    documentType: "Annual Team SaaS Subscription Order",
    summaryHint: "45-day cancel window, 12% uplift cap, retroactive seat billing",
    rawText: `ENTERPRISE WORKSPACE ORDER FORM — CLOUDGRID SYSTEMS

2. Subscription Term & Renewal Notice
This Order Form commits Customer to an initial 12-month term ($480/month billed annually at $5,760). This subscription automatically renews for successive 12-month periods at a 12% annual price uplift unless Customer submits cancellation through the billing portal at least forty-five (45) days prior to the renewal date.

4. Seat True-Up & Overage Billing
Any collaborator invited with edit permissions automatically converts into a paid annual seat billed retroactively to the start of the current quarter at full list price ($48/seat/month), with no downgrade option until the next annual renewal.

6. Data Export Upon Termination
Upon expiration or cancellation, Customer has seven (7) calendar days to export workspace data in JSON format before automated deletion. Assisted archive recovery after 7 days incurs a $1,200 restoration fee.`,
  },
];
