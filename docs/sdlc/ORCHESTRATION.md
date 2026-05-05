# Pipeline Orchestration

## Trigger

When the user sends an **idea**, **feature request**, or **requirement**:
1. **Trigger the full pipeline** and run continuously through deployment.
2. **One role per phase** for sequential phases. **Spawn parallel workstreams** when dependencies are independent.
3. **Run through to Maintenance.** Do not stop after PO, BA, or Dev unless the user explicitly says to stop.

## 🚦 The Orchestrator's Most Important Rule

> **Parallel by default. Sequential only when required.**

Before running any two workstreams, ask: "Does workstream B depend on workstream A's output?"
- **Yes** → Run sequentially (A first, then B)
- **No** → **Run in parallel immediately**

## Execution Map

Sequential: Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 Technical BA
Parallel Track A: Technical BA complete → [DEV] + [QE] simultaneously
Parallel Track B: Dev complete → [QE] + [SEC] + [PERF] simultaneously → merge gate → [OPS] Deploy

## Checklist per run

### Sequential phases
- [ ] Phase 0 Discovery: raw request captured
- [ ] Phase 1 [PO]: artifacts in `docs/sdlc/po/{epic-slug}/`
- [ ] Phase 2 [BA]: `docs/sdlc/ba/business/{epic-slug}/`
- [ ] Phase 3 [UX] (if app/web): `docs/sdlc/design/{epic-slug}/`; [PO]+[BA] review until approved
- [ ] Phase 4 [SA]: `docs/sdlc/architecture/`
- [ ] Phase 5 Technical [BA]: `docs/sdlc/ba/technical/`

### ⚡ Parallel Track A (spawn immediately after Phase 5)
- [ ] Spawn [DEV] implementation (all roles: [FE]/[BE]/[MOBILE]/[EMB]/[DATA]/[PLATFORM])
- [ ] Spawn [QE] test plan + test cases in parallel
- [ ] Do NOT wait for one to finish before starting the other

### ⚡ Parallel Track B (spawn when [DEV] is complete)
- [ ] Spawn [QE] test execution
- [ ] Spawn [SEC] security audit
- [ ] Spawn [PERF] performance audit
- [ ] All three run simultaneously — merge gate only after all complete

### Post-merge
- [ ] Phase 9 [OPS]: `docs/sdlc/deploy/`
- [ ] Phase 10: Project Completion Package → SHIPPED ✅
- [ ] Phase 11 Maintenance
