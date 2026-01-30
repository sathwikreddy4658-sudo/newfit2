const About = () => {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Headline */}
        <div className="mb-8 text-center">
          <h1 className="font-poppins font-black text-4xl uppercase" style={{ color: '#3b2a20', borderBottom: '4px solid #b5edce', display: 'inline-block' }}>
            WE <span style={{ color: '#b5edce' }}>REBUILD</span> FOOD, THOUGHTFULLY
          </h1>
        </div>
        {/* Body */}
        <div className="font-saira font-medium text-lg space-y-4 mb-8" style={{ color: '#5e4338' }}>
          <p>Freel It is a snack brand built on a simple idea - to rebuild the foods people crave and make them better.
</p>
          <p>We started Freel It with a simple belief:
The foods people crave can be rebuilt to fit healthier routines.</p>
          <p>Everyday snacks - bars, chocolates, desserts - are foods people genuinely enjoy. But too often, they come with unnecessary compromises - extreme calories, artificial ingredients, or nutrition that feels out of balance. We believed there was a better way to approach them.</p>
          <p>That belief is what led to Freel It.</p>
          <p>At Freel It, we rebuild the foods people love into better, healthier versions. We don’t create food from trends or shortcuts, we start with what people already crave, and then thoughtfully rebuild it from the ground up.</p>
          <p>Every ingredient we use is real and chosen with purpose. Not just to look good on a label, but to help keep nutrition balanced and food enjoyable. <br />
            We focus on better sweetness, sensible calories, and formulations that feel right, without extremes or empty promises.
Our approach is not about removing everything or chasing perfection. It’s about rebuilding food in a way that respects both enjoyment and everyday routines.
</p>
<p>Each Freel It product is designed to fuel better and fit into daily life, whether that’s around workouts, workdays, or moments in between.
Because we believe food shouldn’t lose what matters in the name of being healthy.
And snacks people love deserve to be better.</p>
<p>That’s what Freel It is here to build.</p>
        </div>
        {/* Subtext */}
        <div className="font-saira font-black text-2xl uppercase" style={{ color: '#5e4338', borderLeft: '4px solid #b5edce', paddingLeft: '12px' }}>
          REAL INGREDIENTS. REAL NUTRITION. REBUILT SMARTER.
        </div>
       
      </div>
    </div>
  );
};

export default About;
