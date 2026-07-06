import SwiftUI

struct PaywallTemplateBenefit: Identifiable, Equatable {
    let id: String
    let title: String
    let detail: String
    let systemImage: String
}

struct PaywallTemplatePackage: Identifiable, Equatable {
    let id: String
    let title: String
    let subtitle: String
    let price: String
    let badge: String?
    let trialText: String?
    let isDefault: Bool
    let isEnabled: Bool
}

struct PaywallTemplateView: View {
    let appName: String
    let headline: String
    let subheadline: String
    let benefits: [PaywallTemplateBenefit]
    let packages: [PaywallTemplatePackage]
    let legalDisclosure: String
    let primaryCTATitle: String
    let isPurchasing: Bool
    let purchaseTopologyLabel: String?
    let onPrimaryAction: (PaywallTemplatePackage?) -> Void
    let onRestore: () -> Void
    let onTerms: () -> Void
    let onPrivacy: () -> Void
    let onClose: () -> Void

    @State private var selectedPackageId: String?

    private var selectedPackage: PaywallTemplatePackage? {
        if let selectedPackageId,
           let package = packages.first(where: { $0.id == selectedPackageId }) {
            return package
        }

        return packages.first(where: { $0.isDefault }) ?? packages.first
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 22) {
                closeRow
                hero
                benefitStack
                packageStack
                actionStack
                legalStack
            }
            .padding(.horizontal, 20)
            .padding(.top, 18)
            .padding(.bottom, 28)
        }
        .background(Color(.systemGroupedBackground))
        .onAppear {
            if selectedPackageId == nil {
                selectedPackageId = selectedPackage?.id
            }
        }
    }

    private var closeRow: some View {
        HStack {
            Text(appName)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
                .lineLimit(1)

            Spacer()

            Button(action: onClose) {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .bold))
                    .frame(width: 34, height: 34)
                    .background(Color(.secondarySystemGroupedBackground), in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Close paywall")
            .accessibilityIdentifier("paywall.close")
        }
    }

    private var hero: some View {
        VStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color.accentColor.opacity(0.24), Color(.systemBackground)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                Image(systemName: "sparkles")
                    .font(.system(size: 42, weight: .semibold))
                    .foregroundStyle(Color.accentColor)
            }
            .frame(height: 118)
            .accessibilityHidden(true)

            VStack(spacing: 8) {
                Text(headline)
                    .font(.system(.title2, design: .rounded).weight(.bold))
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)

                Text(subheadline)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var benefitStack: some View {
        VStack(spacing: 10) {
            ForEach(benefits) { benefit in
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: benefit.systemImage)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(Color.accentColor)
                        .frame(width: 24, height: 24)

                    VStack(alignment: .leading, spacing: 3) {
                        Text(benefit.title)
                            .font(.callout.weight(.semibold))
                            .foregroundStyle(.primary)
                            .fixedSize(horizontal: false, vertical: true)

                        Text(benefit.detail)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    Spacer(minLength: 0)
                }
                .padding(14)
                .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .accessibilityIdentifier("paywall.benefit.\(benefit.id)")
            }
        }
    }

    private var packageStack: some View {
        VStack(spacing: 10) {
            ForEach(packages) { package in
                Button {
                    guard package.isEnabled else { return }
                    selectedPackageId = package.id
                } label: {
                    PaywallTemplatePackageRow(
                        package: package,
                        isSelected: selectedPackage?.id == package.id
                    )
                }
                .buttonStyle(.plain)
                .disabled(!package.isEnabled || isPurchasing)
                .accessibilityIdentifier("paywall.package.\(package.id)")
            }
        }
    }

    private var actionStack: some View {
        VStack(spacing: 10) {
            Button {
                onPrimaryAction(selectedPackage)
            } label: {
                HStack(spacing: 8) {
                    if isPurchasing {
                        ProgressView()
                            .tint(.white)
                    }

                    Text(primaryCTATitle)
                        .font(.headline)
                        .lineLimit(2)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .frame(minHeight: 54)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(isPurchasing || selectedPackage?.isEnabled == false)
            .accessibilityIdentifier("paywall.primary_cta")

            if let purchaseTopologyLabel {
                Text(purchaseTopologyLabel)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("paywall.topology_label")
            }

            Button("Restore Purchases", action: onRestore)
                .font(.footnote.weight(.semibold))
                .disabled(isPurchasing)
                .accessibilityIdentifier("paywall.restore")
        }
    }

    private var legalStack: some View {
        VStack(spacing: 10) {
            Text(legalDisclosure)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("paywall.legal_disclosure")

            HStack(spacing: 18) {
                Button("Terms", action: onTerms)
                    .accessibilityIdentifier("paywall.terms")
                Button("Privacy", action: onPrivacy)
                    .accessibilityIdentifier("paywall.privacy")
            }
            .font(.caption.weight(.medium))
            .foregroundStyle(.secondary)
        }
    }
}

private struct PaywallTemplatePackageRow: View {
    let package: PaywallTemplatePackage
    let isSelected: Bool

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 21, weight: .semibold))
                .foregroundStyle(isSelected ? Color.accentColor : Color.secondary)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(package.title)
                        .font(.callout.weight(.bold))
                        .foregroundStyle(.primary)
                        .lineLimit(1)

                    if let badge = package.badge {
                        Text(badge)
                            .font(.caption2.weight(.bold))
                            .padding(.horizontal, 7)
                            .padding(.vertical, 4)
                            .background(Color.accentColor.opacity(0.14), in: Capsule())
                            .foregroundStyle(Color.accentColor)
                            .lineLimit(1)
                    }
                }

                Text(package.subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)

                if let trialText = package.trialText {
                    Text(trialText)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Color.accentColor)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            Spacer(minLength: 8)

            Text(package.price)
                .font(.callout.weight(.semibold))
                .foregroundStyle(package.isEnabled ? .primary : .secondary)
                .multilineTextAlignment(.trailing)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(minHeight: 76)
        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(isSelected ? Color.accentColor : Color(.separator), lineWidth: isSelected ? 2 : 1)
        }
        .opacity(package.isEnabled ? 1 : 0.62)
    }
}

struct PaywallTemplateView_Previews: PreviewProvider {
    static var previews: some View {
        PaywallTemplateView(
            appName: "FocusPlan",
            headline: "Turn missed study days into a plan that adapts",
            subheadline: "Premium keeps your weekly plan realistic as your schedule changes.",
            benefits: [
                PaywallTemplateBenefit(id: "adaptive", title: "Adaptive weekly plan", detail: "Your next sessions rebalance when you miss a day.", systemImage: "calendar.badge.clock"),
                PaywallTemplateBenefit(id: "review", title: "Focused review queue", detail: "Prioritize the topics most likely to slip.", systemImage: "checklist.checked"),
                PaywallTemplateBenefit(id: "history", title: "Progress history", detail: "See streaks, gaps, and recovery patterns.", systemImage: "chart.line.uptrend.xyaxis")
            ],
            packages: [
                PaywallTemplatePackage(id: "annual", title: "Annual", subtitle: "Best for steady progress", price: "$39.99/year", badge: "Best value", trialText: "7 days free", isDefault: true, isEnabled: true),
                PaywallTemplatePackage(id: "monthly", title: "Monthly", subtitle: "Flexible access", price: "$6.99/month", badge: nil, trialText: nil, isDefault: false, isEnabled: true)
            ],
            legalDisclosure: "After the free trial, your subscription renews automatically unless cancelled at least 24 hours before renewal.",
            primaryCTATitle: "Start Free Trial",
            isPurchasing: false,
            purchaseTopologyLabel: nil,
            onPrimaryAction: { _ in },
            onRestore: {},
            onTerms: {},
            onPrivacy: {},
            onClose: {}
        )
    }
}
