# Scenario Plugin — Launch a $1M Business

## Purpose
This is the first fully structured scenario plugin for the AI Agent Workforce Simulator. It is designed to be both:
- a playable management-training scenario
- a producer of real-world business artifacts

This scenario should be the first runnable scenario in MVP.

---

## 1. Plugin Identity

```ts
export const scenarioPlugin = {
  id: "launch-1m-business-v1",
  name: "Launch a $1M Business",
  category: "venture_creation",
  difficulty: "medium",
  estimated_duration: 20,
}
```

---

## 2. Scenario Intent

### Player Objective
Create a viable business concept, define a target customer, shape a compelling offer, and produce an actionable launch plan under budget and time constraints.

### Management Skills Taught
- delegation
- sequencing
- validation before commitment
- balancing creativity with rigor
- resource allocation under constraints

### Real-World Value
The player exits with usable business outputs:
- business concept memo
- ICP summary
- offer design
- launch plan
- risk notes

---

## 3. Scenario Definition

```ts
ScenarioPlugin {
  id: "launch-1m-business-v1"
  name: "Launch a $1M Business"
  objective: "Design a credible path to a $1M business by producing a validated concept, customer profile, offer, and launch plan."

  constraints: [
    { id: "budget", type: "budget", value: 100 },
    { id: "time", type: "time_cycles", value: 10 },
    { id: "max_team", type: "team_size", value: 4 }
  ]

  tasks: [...],
  success_criteria: {...},
  outputs: [...],
  scoring_overrides: {...},
  coaching_overrides: {...}
}
```

---

## 4. Recommended Default Agent Roster

For MVP, the scenario should be playable with these baseline agents:

```ts
const recommendedAgents = [
  {
    role: "research",
    label: "Research Agent"
  },
  {
    role: "creative",
    label: "Creative Agent"
  },
  {
    role: "strategy",
    label: "Strategy Agent"
  },
  {
    role: "qa",
    label: "QA Agent"
  }
]
```

---

## 5. Task Pack

Each task is atomic enough to simulate but meaningful enough to reflect real managerial decision-making.

### Task 1 — Opportunity Research

```ts
{
  id: "opportunity_research",
  name: "Opportunity Research",
  type: "research",
  complexity: 4,
  required_skills: ["research", "reasoning"],
  dependencies: [],
  input_schema: {
    topic_space: "string",
    constraints: "object"
  },
  output_schema: {
    market_opportunities: "string[]",
    customer_pains: "string[]",
    trends: "string[]"
  }
}
```

### Task 2 — Customer Problem Mapping

```ts
{
  id: "customer_problem_mapping",
  name: "Customer Problem Mapping",
  type: "analysis",
  complexity: 5,
  required_skills: ["analysis", "reasoning"],
  dependencies: ["opportunity_research"],
  input_schema: {
    market_opportunities: "string[]",
    customer_pains: "string[]"
  },
  output_schema: {
    icp_candidates: "string[]",
    top_problems: "string[]",
    urgency_score: "number"
  }
}
```

### Task 3 — Idea Generation

```ts
{
  id: "idea_generation",
  name: "Idea Generation",
  type: "generation",
  complexity: 5,
  required_skills: ["creative", "reasoning"],
  dependencies: ["customer_problem_mapping"],
  input_schema: {
    icp_candidates: "string[]",
    top_problems: "string[]"
  },
  output_schema: {
    business_ideas: "string[]",
    differentiators: "string[]"
  }
}
```

### Task 4 — Offer Design

```ts
{
  id: "offer_design",
  name: "Offer Design",
  type: "synthesis",
  complexity: 6,
  required_skills: ["strategy", "analysis"],
  dependencies: ["idea_generation"],
  input_schema: {
    business_ideas: "string[]",
    differentiators: "string[]"
  },
  output_schema: {
    selected_offer: "string",
    pricing_model: "string",
    value_proposition: "string"
  }
}
```

### Task 5 — Launch Plan

```ts
{
  id: "launch_plan",
  name: "Launch Plan",
  type: "generation",
  complexity: 6,
  required_skills: ["strategy", "execution"],
  dependencies: ["offer_design"],
  input_schema: {
    selected_offer: "string",
    pricing_model: "string",
    value_proposition: "string"
  },
  output_schema: {
    channel_plan: "string[]",
    first_30_days: "string[]",
    acquisition_hypotheses: "string[]"
  }
}
```

### Task 6 — Validation Review

```ts
{
  id: "validation_review",
  name: "Validation Review",
  type: "validation",
  complexity: 4,
  required_skills: ["qa", "analysis"],
  dependencies: ["offer_design", "launch_plan"],
  input_schema: {
    selected_offer: "string",
    pricing_model: "string",
    value_proposition: "string",
    channel_plan: "string[]",
    acquisition_hypotheses: "string[]"
  },
  output_schema: {
    risks: "string[]",
    assumptions: "string[]",
    confidence_score: "number",
    revision_requests: "string[]"
  }
}
```

---

## 6. Default Workflow Shape

This should be the default suggested graph shown to the user:

```ts
const defaultWorkflow = {
  nodes: [
    { id: "n1", task_id: "opportunity_research", suggested_role: "research" },
    { id: "n2", task_id: "customer_problem_mapping", suggested_role: "strategy" },
    { id: "n3", task_id: "idea_generation", suggested_role: "creative" },
    { id: "n4", task_id: "offer_design", suggested_role: "strategy" },
    { id: "n5", task_id: "launch_plan", suggested_role: "strategy" },
    { id: "n6", task_id: "validation_review", suggested_role: "qa" }
  ],
  edges: [
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3" },
    { from: "n3", to: "n4" },
    { from: "n4", to: "n5" },
    { from: "n4", to: "n6" },
    { from: "n5", to: "n6" }
  ]
}
```

### Teachable Alternative Paths
The system should allow users to:
- skip QA and suffer robustness penalties
- overuse QA and lose time/cost efficiency
- parallelize research and problem mapping if they build a better workflow later

---

## 7. Constraints

```ts
const constraints = [
  {
    id: "budget",
    label: "Budget",
    type: "budget",
    value: 100,
    penalty_if_exceeded: 0.25
  },
  {
    id: "time",
    label: "Time Cycles",
    type: "time_cycles",
    value: 10,
    penalty_if_exceeded: 0.25
  },
  {
    id: "team_limit",
    label: "Max Team Size",
    type: "team_size",
    value: 4,
    penalty_if_exceeded: 0.15
  }
]
```

---

## 8. Success Criteria

```ts
const successCriteria = {
  minimum_quality: 0.7,
  minimum_robustness: 0.65,
  max_budget: 100,
  max_time: 10,
  required_outputs: [
    "business_concept_memo",
    "icp_summary",
    "offer_design",
    "launch_plan"
  ]
}
```

### Win Condition
Player wins if:
- minimum quality and robustness are met
- budget and time stay within bounds
- all required outputs are produced

### Strong Win Condition
Player earns distinction if:
- quality > 0.85
- robustness > 0.8
- leverage score > threshold
- confidence score from QA > 0.8

---

## 9. Output Templates

```ts
const outputs = [
  {
    id: "business_concept_memo",
    type: "document",
    title: "Business Concept Memo",
    template_fields: [
      "business_name",
      "core_problem",
      "solution_summary",
      "why_now",
      "market_thesis"
    ]
  },
  {
    id: "icp_summary",
    type: "document",
    title: "Ideal Customer Profile Summary",
    template_fields: [
      "target_customer",
      "top_pains",
      "buying_motivation",
      "urgency"
    ]
  },
  {
    id: "offer_design",
    type: "document",
    title: "Offer Design",
    template_fields: [
      "offer_name",
      "pricing_model",
      "value_proposition",
      "key_differentiators"
    ]
  },
  {
    id: "launch_plan",
    type: "document",
    title: "30-Day Launch Plan",
    template_fields: [
      "channels",
      "week_1_actions",
      "week_2_actions",
      "week_3_actions",
      "week_4_actions",
      "acquisition_hypotheses"
    ]
  },
  {
    id: "risk_notes",
    type: "document",
    title: "Risk Notes and Assumptions",
    template_fields: [
      "critical_assumptions",
      "top_risks",
      "validation_gaps",
      "next_tests"
    ]
  }
]
```

---

## 10. Scoring Overrides

This scenario should overweight realism and business viability relative to pure creativity.

```ts
const scoringOverrides = {
  weights: {
    quality: 0.35,
    cost_efficiency: 0.15,
    time_efficiency: 0.15,
    robustness: 0.2,
    business_viability: 0.15
  },
  bonuses: {
    validated_offer_bonus: 0.05,
    strong_icp_bonus: 0.05
  },
  penalties: {
    skipped_validation: 0.15,
    vague_icp: 0.1,
    unrealistic_pricing: 0.1
  }
}
```

---

## 11. Coaching Overrides

This scenario should emphasize managerial lessons around sequencing and validation.

```ts
const coachingOverrides = {
  focus: [
    "validate_before_scaling",
    "sequence_research_before_ideation",
    "match_review_depth_to_risk",
    "avoid_overbuilding_before_customer_clarity"
  ],
  preferredInsightTypes: [
    "bottleneck",
    "overinvestment",
    "weak_validation",
    "poor_sequencing"
  ]
}
```

### Example Coaching Messages
- You generated ideas before narrowing the customer problem, which reduced downstream clarity.
- Your workflow invested heavily in ideation but underweighted validation, increasing concept risk.
- The offer design was promising, but pricing logic lacked enough support from customer evidence.
- QA was added at the right time, which improved robustness without excessive delay.

---

## 12. Failure Patterns to Simulate

```ts
const failurePatterns = [
  {
    id: "premature_ideation",
    trigger: "idea_generation before strong problem clarity",
    effect: "reduced quality and robustness"
  },
  {
    id: "weak_validation",
    trigger: "validation_review omitted or low-quality qa assignment",
    effect: "business viability penalty"
  },
  {
    id: "over_review",
    trigger: "too many review cycles for medium-complexity work",
    effect: "time and cost penalty"
  },
  {
    id: "generic_icp",
    trigger: "customer_problem_mapping output too broad",
    effect: "offer design quality penalty"
  }
]
```

---

## 13. Example Seed Data

```ts
const seedInput = {
  topic_space: "AI-enabled service businesses",
  constraints: {
    budget: 100,
    time_cycles: 10,
    max_team: 4
  }
}
```

---

## 14. JSON-Friendly Export Version

```json
{
  "id": "launch-1m-business-v1",
  "name": "Launch a $1M Business",
  "objective": "Design a credible path to a $1M business by producing a validated concept, customer profile, offer, and launch plan.",
  "constraints": [
    { "id": "budget", "type": "budget", "value": 100 },
    { "id": "time", "type": "time_cycles", "value": 10 },
    { "id": "max_team", "type": "team_size", "value": 4 }
  ],
  "task_ids": [
    "opportunity_research",
    "customer_problem_mapping",
    "idea_generation",
    "offer_design",
    "launch_plan",
    "validation_review"
  ],
  "required_output_ids": [
    "business_concept_memo",
    "icp_summary",
    "offer_design",
    "launch_plan"
  ],
  "default_workflow": {
    "nodes": [
      { "id": "n1", "task_id": "opportunity_research", "suggested_role": "research" },
      { "id": "n2", "task_id": "customer_problem_mapping", "suggested_role": "strategy" },
      { "id": "n3", "task_id": "idea_generation", "suggested_role": "creative" },
      { "id": "n4", "task_id": "offer_design", "suggested_role": "strategy" },
      { "id": "n5", "task_id": "launch_plan", "suggested_role": "strategy" },
      { "id": "n6", "task_id": "validation_review", "suggested_role": "qa" }
    ],
    "edges": [
      { "from": "n1", "to": "n2" },
      { "from": "n2", "to": "n3" },
      { "from": "n3", "to": "n4" },
      { "from": "n4", "to": "n5" },
      { "from": "n4", "to": "n6" },
      { "from": "n5", "to": "n6" }
    ]
  }
}
```

---

## 15. Build Notes for Engineering

Implement this scenario first because it exercises the full loop:
- sequential workflow
- output generation
- validation gate
- scoring
- coaching

Engineering order for this plugin:
1. add shared type support for `ScenarioPlugin`
2. create `launch-1m-business-v1.ts` in `packages/scenario-data`
3. add scenario loader/registry support
4. wire default workflow into UI
5. render required outputs in results screen
6. connect scoring and coaching overrides

---

## 16. Next Recommended Artifact

After this scenario plugin, the next best file to create is:
- `shared-types/scenario.ts`

Then:
- `scenario-data/launch-1m-business-v1.ts`
- `scenario-data/index.ts`

These three files will make the plugin architecture real instead of conceptual.

