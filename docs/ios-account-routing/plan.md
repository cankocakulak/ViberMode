# Per-app iOS deployment account routing

## Summary (for downstream agents)

Bind an existing app to a non-secret `ios-deployment.json` in its actual iOS workspace. Keep credentials in a namespaced macOS Keychain. Preserve legacy behavior for unbound apps. Validate bound team, issuer, bundle and remote App Store Connect app access before any submission side effects. No upload, transfer, credential rotation or production configuration changes in this task.

## Scope and approach

- Add a testable generic account module and an account-only read-only CLI preflight.
- Integrate automatic workspace account selection into the existing TestFlight submitter, with non-bypassable checks and explicit version/build requirements for bound existing apps.
- Add tests for default compatibility, conflicting credentials, bad config, mismatched apps and API failures.
- Update the authorized derived app's project source and generated signing settings; add team handoff instructions. Retire the obsolete direct uploader instead of reusing historical release artifacts.
- Synchronize only changed framework files to the installed support bundle; do not run the broad installer over unrelated local work.

## Exclusions / known baseline limitations

No Ozard changes, no global default changes, no runtime SDK keys, no account secrets in Git. Existing app worktrees are not bulk edited. Existing release manifests are history, not new release inputs. Icon Composer support and old Stage 3 review document gaps in the factory preflight are separate existing release blockers, not grounds to bypass release gates. A new archive/export and product smoke test will still be required for an actual release.

## Validation

Node tests and CLI syntax checks; regenerate the app project using its owned script; inspect effective Release build settings; live GET-only ASC account preflight; assert installed runtime matches source. No build upload.
