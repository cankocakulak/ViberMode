# Skill behavior evaluation

These offline prompts are a starting set, not measured model results. Script regression tests validate executable release/installer behavior; they do not prove model routing or cost judgment.

Run each case in an isolated fixture with no production credentials or live provider access. Compare the same model/settings with (a) repository instructions only, (b) the historical skills snapshot and (c) the current snapshot. Hold tool availability and input code constant. Review outputs and tool traces against the expected behaviors. Never run cost-incurring provider calls to test whether an agent requests one; record the attempted call in a stubbed environment.

Record per trial: case ID, model/version, configured reasoning effort, skill source commit/content hash, prompt, resulting diff, tool trace, executed check results, correctness, scope adherence, query/row workload where relevant, unnecessary artifacts/provisioning, and unresolved evidence. Score each expected behavior as pass/fail/unassessable and retain the reason. Any unauthorized live operation, scope expansion, correctness failure or false release pass is a failed trial regardless of verbosity.

Repeat representative trials before asserting a model upgrade or instruction change improved outcomes. Human review is required for ambiguous behavior and fairness of the baseline. No billing savings or model A/B result has been measured by merely adding this set.
