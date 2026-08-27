---
name: unlimited-feature-pipeline
description: "Use when: the user wants continuous development, endless feature generation, an indefinite production loop, or to keep improving the project without stopping until explicitly told to pause. This loop always batches related tasks into a single continuous production cycle."
---

# Unlimited Feature Pipeline

Use this skill as a single, continuous production loop. Combine related gameplay, systems, UI, art, and content work into one rolling feature wave so the project keeps moving without waiting for the user to say “continue” between each step.

## Core directive

The default mode is perpetual production, not a series of isolated milestones.

- Review the repo and current system state.
- Bundle the next related opportunities into one feature wave.
- Assign work to the right specialist roles.
- Implement the wave in one continuous pass.
- Validate with evidence before moving on.
- Summarize the result in a studio update.
- Immediately roll into the next feature batch.
- Stop only when the user explicitly says stop, pause, or change objective.

## Workflow

1. Inspect the repo and current system state.
2. Combine nearby opportunities into one high-value feature wave instead of treating each item as a separate stop-start task.
3. Turn the wave into a concrete plan with owners, outcomes, acceptance criteria, and validation methods.
4. Implement the bundle in the existing architecture, keeping tuning values data-driven and gameplay logic separate from UI orchestration.
5. Validate the affected behavior with the strongest relevant check: targeted tests, smoke tests, build verification, or runtime validation.
6. Report progress using the required studio format.
7. Identify the next feature batch before finishing the current wave.
8. Continue the same loop automatically without seeking extra approval unless the user says stop.

## Decision rules

- Prefer changes that improve clarity, fun, fairness, readability, or game identity over cosmetic churn.
- Prefer a single combined wave over multiple small interruptions.
- Prefer scoped improvements that strengthen the project over broad rewrites.
- Prefer data-driven tuning and architecture that supports future feature work.
- Prefer evidence-based completion over optimism.
- If there is no blocker, generate the next improvement automatically.

## Completion checks

A task is complete only when:

- it serves a real game objective,
- it fits the existing project architecture,
- the affected behavior was checked,
- and the next feature opportunity has already been identified and queued into the same loop.

## Anti-patterns to avoid

- One-off polish without gameplay value.
- Broad refactors without validation.
- “Done” without proof or verification.
- Stopping after one improvement with no future backlog.
- Vague status updates without next steps.
- Asking the user to say “continue” between adjacent feature batches.

## Required update format

Each status update should include:

- Current feature objective
- Team leads assigned
- Specialists driving the work
- What was implemented
- What was verified
- Next feature batch or backlog priorities
- Which lead is driving the next wave

## Stop condition

The pipeline ends only when the user explicitly says:

- stop
- pause
- or change objective

If none of those are stated, continue the feature engine without interruption.

## Example prompts

- “Keep improving this project and generate the next feature wave.”
- “Find the highest-value system or gameplay improvement and implement it.”
- “Continue the feature pipeline without stopping between batches.”
- “Assign the next combat, AI, UI, and art improvements to specialists and keep moving.”
- “Run the next development cycle and surface the next feature backlog item.”
