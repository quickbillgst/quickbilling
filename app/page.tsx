import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, BarChart3, Users, CreditCard, Zap, Shield, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            GST Billing Platform
          </h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <div className="space-y-8 text-center">
          <h2 className="text-5xl font-bold text-slate-900 leading-tight">
            Professional GST Billing for Indian SMEs
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            A production-grade billing and invoicing platform with integrated GST calculation, 
            e-Invoice generation, inventory management, and compliance reporting.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Your Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-3 gap-8 text-center">
        <div>
          <p className="text-4xl font-bold text-blue-600">10k+</p>
          <p className="text-slate-600 mt-2">Businesses</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-blue-600">100M+</p>
          <p className="text-slate-600 mt-2">Invoices Processed</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-blue-600">99.95%</p>
          <p className="text-slate-600 mt-2">Uptime SLA</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-8 py-20 space-y-12">
        <h3 className="text-4xl font-bold text-slate-900 text-center">
          Powerful Features for GST Compliance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <FileText className="w-12 h-12 text-blue-600 mb-4" />
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              Smart Invoicing
            </h4>
            <p className="text-slate-600">
              Create professional invoices with automatic GST calculation, tax breakdowns, and compliance flags.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <BarChart3 className="w-12 h-12 text-green-600 mb-4" />
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              GST Returns Ready
            </h4>
            <p className="text-slate-600">
              Generate GSTR-1, GSTR-3B, and compliance reports with a single click. No manual reconciliation needed.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <Users className="w-12 h-12 text-purple-600 mb-4" />
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              Customer Management
            </h4>
            <p className="text-slate-600">
              Manage customers with GSTIN verification, credit limits, and TDS applicability tracking.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <CreditCard className="w-12 h-12 text-orange-600 mb-4" />
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              Payment Integration
            </h4>
            <p className="text-slate-600">
              Integrated payment links, UPI QR codes, and reconciliation with bank feeds. Accept payments instantly.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <Zap className="w-12 h-12 text-yellow-600 mb-4" />
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              e-Invoice & e-Way Bill
            </h4>
            <p className="text-slate-600">
              Automatic e-Invoice generation with IRN, QR code embedding, and e-Way Bill integration.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <Shield className="w-12 h-12 text-red-600 mb-4" />
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              Enterprise Security
            </h4>
            <p className="text-slate-600">
              Bank-grade encryption, multi-tenant isolation, RBAC, and comprehensive audit logging for compliance.
            </p>
          </div>
        </div>
      </section>

      {/* GST Features Detail */}
      <section className="max-w-6xl mx-auto px-8 py-20 space-y-12">
        <h3 className="text-4xl font-bold text-slate-900 text-center">
          Complete GST Tax Engine
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h4 className="text-2xl font-bold text-slate-900">Built-in Tax Logic</h4>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>CGST/SGST for intra-state, IGST for inter-state transactions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Place of supply determination (goods vs services)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>TDS/TCS calculation for unregistered suppliers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Export & SEZ exemptions with zero GST</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Reverse charge mechanism for B2B unregistered suppliers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>5% | 12% | 18% | 28% standard GST rates with cess</span>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-2xl font-bold text-slate-900">Inventory & Tracking</h4>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Product master with HSN/SAC code mapping</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Batch tracking with manufacturing and expiry dates</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Real-time stock ledger (immutable audit trail)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Barcode generation & scanning (EAN-13, Code128, QR)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Multi-warehouse stock management</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>Reorder point alerts and inventory valuation</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-8 py-20 space-y-12 bg-white rounded-2xl">
        <h3 className="text-4xl font-bold text-slate-900 text-center">
          Simple, Transparent Pricing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="border border-slate-200 rounded-lg p-8 space-y-6">
            <h4 className="text-2xl font-bold text-slate-900">Starter</h4>
            <div>
              <p className="text-4xl font-bold text-blue-600">₹0</p>
              <p className="text-slate-600 text-sm">14-day free trial</p>
            </div>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>✓ Unlimited Invoices</li>
              <li>✓ GST Calculation</li>
              <li>✓ Basic Reports</li>
              <li>✗ Payment Integration</li>
              <li>✗ e-Invoice (Coming Soon)</li>
            </ul>
            <Button variant="outline" className="w-full bg-transparent">
              Start Free Trial
            </Button>
          </div>

          {/* Professional */}
          <div className="border-2 border-blue-600 rounded-lg p-8 space-y-6 relative">
            <div className="absolute -top-3 left-6 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
              Most Popular
            </div>
            <h4 className="text-2xl font-bold text-slate-900">Professional</h4>
            <div>
              <p className="text-4xl font-bold text-blue-600">₹4,999</p>
              <p className="text-slate-600 text-sm">per month</p>
            </div>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>✓ Everything in Starter</li>
              <li>✓ Payment Integration</li>
              <li>✓ Advanced Reports</li>
              <li>✓ e-Invoice & e-Way Bill</li>
              <li>✓ Priority Support</li>
            </ul>
            <Button className="w-full">
              Start Free Trial
            </Button>
          </div>

          {/* Enterprise */}
          <div className="border border-slate-200 rounded-lg p-8 space-y-6">
            <h4 className="text-2xl font-bold text-slate-900">Enterprise</h4>
            <div>
              <p className="text-4xl font-bold text-blue-600">Custom</p>
              <p className="text-slate-600 text-sm">contact sales</p>
            </div>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>✓ Everything in Professional</li>
              <li>✓ Custom Integrations</li>
              <li>✓ Dedicated Account Manager</li>
              <li>✓ SLA Guarantees</li>
              <li>✓ On-Premises Deployment</li>
            </ul>
            <Button variant="outline" className="w-full bg-transparent">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-8 py-20 text-center space-y-8">
        <h3 className="text-4xl font-bold text-slate-900">
          Ready to Streamline Your Billing?
        </h3>
        <p className="text-xl text-slate-600">
          Join thousands of Indian businesses using our platform to manage GST compliance with ease.
        </p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Get Started Today <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-8 text-center space-y-4">
          <p className="font-bold">GST Billing Platform</p>
          <p className="text-slate-400 text-sm">
            Production-grade billing solution for Indian SMEs. Designed for GST compliance and scalability.
          </p>
          <p className="text-slate-500 text-xs">
            © 2024 GST Billing Platform. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </footer>
    </div>
  );
}
