# Pattern: Benefit Stack Packages

## Intent

Use this pattern when a generated iOS app needs a credible upgrade surface before or alongside real StoreKit/RevenueCat integration. It should communicate the premium outcome, show concrete benefits, let users inspect packages, and expose restore/legal routes without pretending a deferred purchase flow is live.

## Structure

1. Premium promise
   - Headline names the domain-specific premium outcome.
   - Supporting line explains why upgrading helps the user's current goal.
   - Visual slot uses a compact app-specific animation, chart, preview, or symbol treatment.

2. Benefit stack
   - 3-4 benefits tied to implemented or explicitly deferred premium capabilities.
   - Each benefit includes a short title and one-line proof or outcome.
   - Avoid generic words such as unlimited, smarter, powerful unless the feature proves them.

3. Package selector
   - Monthly and yearly package cards when subscriptions are in scope.
   - One recommended badge when the UX names a default choice.
   - Disabled or preview state when purchase wiring is deferred.

4. CTA and routes
   - Primary CTA reflects runtime truth: purchase, start trial, preview premium, join waitlist, or continue.
   - Restore purchases route is always visible when purchases are in scope.
   - Terms, privacy, and close routes are visible and tappable.

## Required Adaptation

- Replace all package labels, pricing, and trial text with approved values or mock-state copy.
- Replace benefits with app-specific capabilities from PRD and stories.
- Wire CTA behavior to runtime topology: live purchase, deferred service, local preview, or disabled mock.
- Use stable identifiers for package cards, CTA, restore, close, terms, and privacy.
- Keep legal and restore routes present even when the shell is non-purchasing.

## SwiftUI Scaffold

```swift
struct PaywallBenefit: Identifiable {
    let id: String
    let title: String
    let detail: String
    let systemImage: String
}

struct PaywallPackage: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let price: String
    let badge: String?
    let isEnabled: Bool
}

struct FactoryPaywallView: View {
    let headline: String
    let subheadline: String
    let benefits: [PaywallBenefit]
    let packages: [PaywallPackage]
    let isPurchasingEnabled: Bool
    let onPrimaryAction: (PaywallPackage?) -> Void
    let onRestore: () -> Void
    let onClose: () -> Void

    @State private var selectedPackageId: String?

    var selectedPackage: PaywallPackage? {
        packages.first { $0.id == selectedPackageId } ?? packages.first
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                HStack {
                    Spacer()
                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .font(.headline)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("paywall.close")
                }

                PaywallVisual()
                    .frame(height: 132)

                VStack(spacing: 10) {
                    Text(headline)
                        .font(.system(.title2, design: .rounded).weight(.bold))
                        .multilineTextAlignment(.center)

                    Text(subheadline)
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                VStack(spacing: 12) {
                    ForEach(benefits) { benefit in
                        HStack(alignment: .top, spacing: 12) {
                            Image(systemName: benefit.systemImage)
                                .foregroundStyle(.tint)
                                .frame(width: 24)

                            VStack(alignment: .leading, spacing: 3) {
                                Text(benefit.title)
                                    .font(.callout.weight(.semibold))
                                Text(benefit.detail)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                    }
                }

                VStack(spacing: 10) {
                    ForEach(packages) { package in
                        Button {
                            guard package.isEnabled else { return }
                            selectedPackageId = package.id
                        } label: {
                            PackageRow(
                                package: package,
                                isSelected: selectedPackage?.id == package.id
                            )
                        }
                        .buttonStyle(.plain)
                        .disabled(!package.isEnabled)
                        .accessibilityIdentifier("paywall.package.\(package.id)")
                    }
                }

                Button {
                    onPrimaryAction(isPurchasingEnabled ? selectedPackage : nil)
                } label: {
                    Text(isPurchasingEnabled ? "Continue" : "Preview Premium")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .accessibilityIdentifier("paywall.primary_cta")

                Button("Restore Purchases", action: onRestore)
                    .font(.footnote.weight(.medium))
                    .accessibilityIdentifier("paywall.restore")

                HStack(spacing: 16) {
                    Link("Terms", destination: URL(string: "https://example.com/terms")!)
                    Link("Privacy", destination: URL(string: "https://example.com/privacy")!)
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            .padding(24)
        }
    }
}
```

## Review Checklist

- The headline names the premium outcome, not only the word Pro.
- Benefits match real or explicitly deferred premium behavior.
- Package state is honest when purchase integration is not live.
- Restore, terms, privacy, and close routes are reachable.
- The CTA and package labels fit on compact iPhone screens.
