# MCP Integration Patterns

## Skills + MCP Relationship

**MCP (Connectivity):** Connects Claude to services (Notion, Linear, Slack, etc.) - what Claude CAN do

**Skills (Knowledge):** Teaches Claude workflows and best practices - HOW Claude SHOULD do it

### The Kitchen Analogy

- **MCP** = Professional kitchen (tools, ingredients, equipment)
- **Skills** = Recipes (step-by-step instructions for valuable outcomes)

Together: Users accomplish complex tasks without figuring out every step.

---

## Why MCP Users Need Skills

**Without skills:**
- Users connect MCP but don't know what to do next
- Each conversation starts from scratch
- Inconsistent results (users prompt differently)
- Users blame connector when issue is workflow guidance

**With skills:**
- Pre-built workflows activate automatically
- Consistent, reliable tool usage
- Best practices embedded in every interaction
- Lower learning curve

---

## Pattern 1: Sequential Workflow Orchestration

**Use when:** Multi-step processes in specific order.

```markdown
## Workflow: Onboard New Customer

### Step 1: Create Account
Call MCP tool: `create_customer`
Parameters: name, email, company

### Step 2: Setup Payment
Call MCP tool: `setup_payment_method`
Wait for: payment method verification

### Step 3: Create Subscription
Call MCP tool: `create_subscription`
Parameters: plan_id, customer_id (from Step 1)

### Step 4: Send Welcome Email
Call MCP tool: `send_email`
Template: welcome_email_template
```

**Key techniques:**
- Explicit step ordering
- Dependencies between steps
- Validation at each stage
- Rollback instructions for failures

---

## Pattern 2: Multi-MCP Coordination

**Use when:** Workflows span multiple services.

**Example: Design-to-Development Handoff**

```markdown
### Phase 1: Design Export (Figma MCP)
1. Export design assets from Figma
2. Generate design specifications
3. Create asset manifest

### Phase 2: Asset Storage (Drive MCP)
1. Create project folder in Drive
2. Upload all assets
3. Generate shareable links

### Phase 3: Task Creation (Linear MCP)
1. Create development tasks
2. Attach asset links to tasks
3. Assign to engineering team

### Phase 4: Notification (Slack MCP)
1. Post handoff summary to #engineering
2. Include asset links and task references
```

**Key techniques:**
- Clear phase separation
- Data passing between MCPs
- Validation before moving to next phase
- Centralized error handling

---

## Pattern 3: Context-Aware Tool Selection

**Use when:** Same outcome, different tools depending on context.

```markdown
## Smart File Storage

### Decision Tree
1. Check file type and size
2. Determine best storage location:
   - Large files (>10MB): Use cloud storage MCP
   - Collaborative docs: Use Notion/Docs MCP
   - Code files: Use GitHub MCP
   - Temporary files: Use local storage

### Execute Storage
Based on decision:
- Call appropriate MCP tool
- Apply service-specific metadata
- Generate access link

### Provide Context to User
Explain why that storage was chosen
```

**Key techniques:**
- Clear decision criteria
- Fallback options
- Transparency about choices

---

## Pattern 4: Domain-Specific Intelligence

**Use when:** Skill adds specialized knowledge beyond tool access.

```markdown
## Payment Processing with Compliance

### Before Processing (Compliance Check)
1. Fetch transaction details via MCP
2. Apply compliance rules:
   - Check sanctions lists
   - Verify jurisdiction allowances
   - Assess risk level
3. Document compliance decision

### Processing
IF compliance passed:
  - Call payment processing MCP tool
  - Apply appropriate fraud checks
  - Process transaction
ELSE:
  - Flag for review
  - Create compliance case

### Audit Trail
- Log all compliance checks
- Record processing decisions
- Generate audit report
```

**Key techniques:**
- Domain expertise embedded in logic
- Compliance before action
- Comprehensive documentation
- Clear governance

---

## MCP Troubleshooting

### Connection Issues

**Symptom:** Skill loads but MCP calls fail

**Checklist:**
1. Verify MCP server connected (Settings > Extensions)
2. Check authentication (API keys valid, proper scopes)
3. Test MCP independently: "Use [Service] MCP to fetch my projects"
4. Verify tool names match MCP server documentation (case-sensitive)

### Include in Skill

```markdown
## Common Issues

### MCP Connection Failed
If you see "Connection refused":
1. Verify MCP server is running: Check Settings > Extensions
2. Confirm API key is valid
3. Try reconnecting: Settings > Extensions > [Your Service] > Reconnect
```

---

## Skill Structure for MCP

```
mcp-workflow-skill/
├── SKILL.md
└── references/
    ├── tool-reference.md      # MCP tool names and parameters
    ├── workflow-patterns.md   # Common sequences
    └── error-handling.md      # MCP-specific errors
```

### Description Template

```yaml
description: "[Workflow description] using [Service] MCP. Use when user says '[trigger phrases]'. Requires [Service] MCP server connected."
```

### Compatibility Field

```yaml
compatibility: Requires [service-name] MCP server. See [setup-url] for configuration.
```
