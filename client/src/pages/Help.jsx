import React, { useState } from "react";
import PageLayout from "../components/PageLayout.jsx";

export default function Help() {
  const faqs = [
    {
      q: "How do I report a wrong bill amount?",
      a: "Contact the Mess Manager about it."
    },
    {
      q: "How do I change my registered UPI ID for payments?",
      a: "Currently, students cannot change UPI ID. Contact the Hostel Office to update it."
    },
    {
      q: "How do I give feedback for meals?",
      a: "Navigate to the Feedback section from the dashboard and submit ratings or comments."
    },
    {
      q: "I marked absence but bill still includes those days.",
      a: "Absence exemption reflects in the next billing cycle. Contact Mess Manager if still incorrect."
    }
  ];

  const [openFAQ, setOpenFAQ] = useState(null);

  return (
    <PageLayout
      title="Help & Support"
      subtitle="Find answers to common questions or reach out for assistance."
    >
      {/* FAQ Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition"
              onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-neutral-800">{faq.q}</h3>
                <span className="text-xl">{openFAQ === index ? "−" : "+"}</span>
              </div>
              {openFAQ === index && (
                <p className="text-neutral-600 mt-2">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section className="bg-white border p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Need More Help?</h2>
        <p className="text-neutral-600 mb-4">
          If your issue isn't listed above, you can reach out to the Mess Administration.
        </p>

        <div className="space-y-2 text-neutral-700 text-sm">
          <p><strong>Email:</strong> messsupport@iiita.ac.in</p>
          <p><strong>Phone:</strong> +91 98765 43210</p>
          <p><strong>Office Hours:</strong> 9:00 AM – 5:00 PM (Mon–Sat)</p>
        </div>
      </section>
    </PageLayout>
  );
}
