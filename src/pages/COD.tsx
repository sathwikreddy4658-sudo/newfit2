const COD = () => {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Headline */}
        <div className="mb-8 text-center">
          <h1 className="font-poppins font-black text-4xl uppercase" style={{ color: '#3b2a20', borderBottom: '4px solid #b5edce', display: 'inline-block' }}>
            CASH ON DELIVERY (COD) POLICY
          </h1>
        </div>

        {/* Effective Date */}
        <div className="mb-8 text-center">
          <p className="font-poppins font-light text-lg text-primary-brown">
            Effective Date: October 2025
          </p>
        </div>

        {/* Intro */}
        <div className="mb-8">
          <p className="font-poppins font-light text-base text-primary-brown">
            We offer Cash on Delivery for convenience, with a few simple guidelines.
          </p>
        </div>

        {/* Section 1 */}
        <div className="mb-8">
          <h3 className="font-poppins font-black text-2xl mb-4 text-primary-dark">
            Availability
          </h3>
          <div className="font-poppins font-light text-base space-y-2 text-primary-brown">
            <p className="font-poppins font-light text-base space-y-2">COD is available only for orders below ₹1300.</p>
            <p>The option may not be available in some remote locations.</p>
          </div>
        </div>

        {/* Section 2 */}
        <div className="mb-8">
          <h3 className="font-poppins font-black text-2xl mb-4 text-primary-dark">
            Order Confirmation
          </h3>
          <div className="font-poppins font-light text-base space-y-2 text-primary-brown">
            <p>Our courier partner may call before delivery to confirm availability of cash. Please ensure someone is present to accept and pay.</p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="mb-8">
          <h3 className="font-poppins font-black text-2xl mb-4 text-primary-dark">
            Refunds for COD Orders
          </h3>
          <div className="font-poppins font-light text-base space-y-2 text-primary-brown">
            <p>If a COD order qualifies for a refund (for example, wrong or damaged item):</p>
            <p>You'll be asked to share your bank account details for a secure refund transfer within 5-7 business days.</p>
          </div>
        </div>

        {/* Section 4 */}
        <div className="mb-8">
          <h3 className="font-poppins font-black text-2xl mb-4 text-primary-dark">
            Misuse or Repeated Refusals
          </h3>
          <div className="font-poppins font-light text-base space-y-2 text-primary-brown">
            <p>Repeated refusal of COD parcels may result in COD being disabled for future orders.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default COD;
