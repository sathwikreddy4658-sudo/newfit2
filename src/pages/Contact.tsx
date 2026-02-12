const Contact = () => {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Headline */}
        <div className="mb-8 text-center">
          <h1 className="font-poppins font-black text-4xl uppercase" style={{ color: '#3b2a20', borderBottom: '4px solid #b5edce', display: 'inline-block' }}>
            WE'D LOVE TO HEAR FROM YOU.
          </h1>
        </div>

        {/* Body */}
        <div className="mb-8 border-left-accent">
          <p className="font-saira font-medium text-base text-primary-dark">
            Whether it's a feedback, a question about your order, or just a thought about better food, we're always listening.
          </p>
        </div>

        {/* Customer Support */}
        <div className="mb-8">
          <h3 className="font-poppins font-black text-2xl mb-4 text-primary-dark">
            Customer Support
          </h3>
          <div className="font-saira font-medium text-base space-y-2">
            <p className="text-primary-dark">For help with orders, shipping, or general inquiries:</p>
            <div className="border-left-accent">
              <p className="text-primary-brown">📧 <a href="mailto:care@freelit.in" className="link-secondary">care@freelit.in</a></p>
              <p className="text-primary-brown">📞 <a href="https://wa.me/message/4WPWICKFBYNCB1" target="_blank" rel="noopener noreferrer" className="link-secondary">+91 6302254190 (WhatsApp)</a></p>
            </div>
            <p className="text-primary-dark">We usually respond within 24-48 hours on business days.</p>
          </div>
        </div>

        {/* Mailing Address */}
        <div className="mb-8">
          <h3 className="font-poppins font-black text-2xl mb-4 text-primary-dark">
            Mailing Address
          </h3>
          <div className="border-left-accent">
            <p className="font-saira font-medium text-base text-accent-green">Freel It</p>
            <p className="font-saira font-medium text-base text-primary-brown">108, PSR Pride, Beside Canton Rows, Mechal-Malkajgiri, Hyderabad, 500067, India</p>
          </div>
        </div>

        {/* Collaborations & Partnerships */}
        <div className="mb-8">
          <h3 className="font-poppins font-black text-2xl mb-4 text-primary-dark">
            Collaborations & Partnerships
          </h3>
          <div className="font-saira font-medium text-base">
            <p className="text-primary-dark">
              If you're a creator, nutrition expert, or brand that shares our values and would like to collaborate, email us at <a href="mailto:care@freelit.in" className="link-accent">care@freelit.in</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
