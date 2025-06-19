import React, { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';

export function CopyrightPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contentUrl: '',
    claimType: 'copyright',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you would send this data to your backend
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        contentUrl: '',
        claimType: 'copyright',
        description: ''
      });
    } catch (err) {
      setError("There was an error submitting your claim. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Copyright & Content Claims</h1>

      <div className="prose prose-sm md:prose-base max-w-none mb-8">
        <p>
          At Inlits, we respect the intellectual property rights of others and expect our users to do the same. 
          If you believe that your work has been copied in a way that constitutes copyright infringement, or that 
          your intellectual property rights have been otherwise violated, please submit a claim using the form below.
        </p>

        <h2>DMCA Compliance</h2>
        <p>
          Inlits complies with the Digital Millennium Copyright Act (DMCA). If you believe that content on our 
          platform infringes your copyright, you may submit a DMCA notification. Upon receiving a valid notice, 
          we will remove or disable access to the content and notify the content provider.
        </p>

        <h2>What Information to Include</h2>
        <p>For your claim to be valid, please include the following information:</p>
        <ul>
          <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf</li>
          <li>Identification of the copyrighted work claimed to have been infringed</li>
          <li>Identification of the material that is claimed to be infringing and where it is located on our service</li>
          <li>Your contact information, including your address, telephone number, and email</li>
          <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or law</li>
          <li>A statement, made under penalty of perjury, that the information in the notification is accurate and that you are authorized to act on behalf of the copyright owner</li>
        </ul>

        <h2>Counter-Notification</h2>
        <p>
          If you believe your content was removed in error, you may submit a counter-notification by 
          emailing <a href="mailto:copyright@inlits.com" className="text-primary hover:underline">copyright@inlits.com</a> with the following information:
        </p>
        <ul>
          <li>Your physical or electronic signature</li>
          <li>Identification of the material that has been removed</li>
          <li>A statement under penalty of perjury that you have a good faith belief that the material was removed as a result of mistake or misidentification</li>
          <li>Your name, address, and telephone number</li>
          <li>A statement that you consent to the jurisdiction of the federal court in the district where you live (or the Northern District of California if you live outside the U.S.)</li>
          <li>A statement that you will accept service of process from the person who provided the original notification</li>
        </ul>

        <h2>Contact Information</h2>
        <p>
          For copyright matters: <a href="mailto:copyright@inlits.com" className="text-primary hover:underline">copyright@inlits.com</a><br />
          For general support: <a href="mailto:support@inlits.com" className="text-primary hover:underline">support@inlits.com</a><br />
          For advertising inquiries: <a href="mailto:advertising@inlits.com" className="text-primary hover:underline">advertising@inlits.com</a><br />
          For business partnerships: <a href="mailto:partnerships@inlits.com" className="text-primary hover:underline">partnerships@inlits.com</a>
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Submit a Copyright Claim</h2>

        {success ? (
          <div className="bg-primary/10 text-primary p-4 rounded-lg">
            <p>
              Thank you for your submission! We've received your copyright claim and will review it promptly.
              Our team will contact you at the email address provided if we need additional information.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contentUrl" className="block text-sm font-medium mb-1">
                URL of Content in Question
              </label>
              <input
                type="url"
                id="contentUrl"
                name="contentUrl"
                value={formData.contentUrl}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://inlits.com/..."
              />
            </div>

            <div>
              <label htmlFor="claimType" className="block text-sm font-medium mb-1">
                Claim Type
              </label>
              <select
                id="claimType"
                name="claimType"
                value={formData.claimType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="copyright">Copyright Infringement</option>
                <option value="trademark">Trademark Infringement</option>
                <option value="attribution">Missing Attribution</option>
                <option value="privacy">Privacy Violation</option>
                <option value="other">Other Intellectual Property Claim</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Detailed Description of Claim
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Please provide details about your claim, including information about the original work and how it's being infringed..."
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="agreement"
                required
                className="rounded border-input"
              />
              <label htmlFor="agreement" className="text-sm">
                I certify, under penalty of perjury, that the information in this notification is accurate and that I am authorized to act on behalf of the owner of the exclusive right that is allegedly infringed.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Claim
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="bg-muted/30 border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Repeat Infringer Policy</h2>
        <p className="text-sm text-muted-foreground">
          Inlits maintains a policy of terminating the accounts of users who are determined to be repeat infringers of copyright or other intellectual property rights. A repeat infringer is a user who has been notified of infringing activity multiple times and/or has had content removed from our service multiple times.
        </p>
      </div>
    </div>
  );
}

export default CopyrightPage;