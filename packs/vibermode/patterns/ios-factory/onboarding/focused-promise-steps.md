# Pattern: Focused Promise Steps

## Intent

Use this pattern for generated iOS apps that need a fast, polished first-launch sequence before the first-value action. The pattern should make the app's promise understandable, show how the mechanic works, and route the user into the first useful action without account, purchase, or settings friction.

## Structure

1. Promise step
   - Title: the concrete outcome the app helps the user reach.
   - Visual slot: app-specific animation, symbol motion, or generated still that represents the outcome.
   - Supporting copy: one sentence that names the user's problem and the product's approach.

2. Mechanic step
   - Title: the signature interaction or learning loop.
   - Visual slot: short native animation showing the input -> feedback -> next action loop.
   - Feature bullets: 2-3 benefits tied to implemented behavior.

3. First-action step
   - Title: invitation into the first-value moment.
   - Visual slot: preview of the first useful screen, not a generic illustration.
   - CTA: route to the first-value entry point named in `docs/[project-name]/ux.md`.
   - Secondary action: only when the PRD requires skip, restore, or sign-in.

## Required Adaptation

- Replace the promise, mechanic, benefits, and CTA with domain-specific copy from PRD and UX.
- Replace the visual slot with app-specific animation or imagery.
- Add stable identifiers for UI tests and screenshots.
- Persist completion locally and provide a QA reset route.
- Keep the sequence to 2-3 steps unless the approved UX includes setup.

## SwiftUI Scaffold

```swift
struct OnboardingStep: Identifiable {
    let id: String
    let title: String
    let message: String
    let animationName: String?
    let systemImage: String
    let benefits: [String]
    let ctaTitle: String?
}

struct FactoryOnboardingView: View {
    let steps: [OnboardingStep]
    let onComplete: () -> Void

    @State private var selectedIndex = 0

    var body: some View {
        VStack(spacing: 24) {
            TabView(selection: $selectedIndex) {
                ForEach(Array(steps.enumerated()), id: \.element.id) { index, step in
                    VStack(spacing: 18) {
                        OnboardingVisual(step: step)
                            .frame(height: 180)

                        VStack(spacing: 10) {
                            Text(step.title)
                                .font(.system(.title2, design: .rounded).weight(.bold))
                                .multilineTextAlignment(.center)

                            Text(step.message)
                                .font(.body)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                        }

                        VStack(alignment: .leading, spacing: 10) {
                            ForEach(step.benefits, id: \.self) { benefit in
                                Label(benefit, systemImage: "checkmark.circle.fill")
                                    .font(.callout.weight(.medium))
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.horizontal, 24)
                    .tag(index)
                    .accessibilityIdentifier("onboarding.step.\(step.id)")
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .automatic))

            Button(action: advance) {
                Text(currentCTA)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .accessibilityIdentifier("onboarding.primary_cta")
        }
        .padding(.vertical, 28)
    }

    private var currentCTA: String {
        steps[selectedIndex].ctaTitle ?? (selectedIndex == steps.count - 1 ? "Start" : "Continue")
    }

    private func advance() {
        if selectedIndex == steps.count - 1 {
            onComplete()
        } else {
            withAnimation(.snappy(duration: 0.28)) {
                selectedIndex += 1
            }
        }
    }
}
```

## Review Checklist

- The first title names a specific product promise.
- The final CTA routes into the first-value entry, not a generic home screen.
- The visual slot is app-specific and inspectable in screenshots.
- The flow handles small screens without clipped CTA text.
- The app can relaunch after completion without showing onboarding again.
