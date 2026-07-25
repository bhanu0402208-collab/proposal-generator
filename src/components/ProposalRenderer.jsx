import React from 'react';

const FIXED_HEADER = `Atoms Digital Solutions Private Limited
CIN: U74999AP2022PTC133342
Email: atomsdigitalsolutions@gmail.com | Phone: +91 98765 43210
DIGITAL MARKETING PROPOSAL`;

const FIXED_OBJECTIVES = [
    "Build a strong and consistent digital presence",
    "Increase visibility and brand awareness among target patients",
    "Educate patients through valuable and relevant content",
    "Build trust and credibility through doctor-led content",
    "Drive appointment bookings and patient enquiries",
    "Improve Google search rankings and local discoverability",
    "Strengthen reputation through patient testimonials and reviews"
];

const FIXED_IMPORTANT_NOTES = [
    "Ad budget is separate from the management fee quoted above",
    "Results depend on consistency of content creation and posting",
    "Doctor/hospital participation improves content performance significantly",
    "4-day lead time required for additional design requests"
];

const FIXED_FOOTER = `Atoms Digital Solutions Private Limited
Flat No. 301, Sri Siva Sankari Nilayam, Gorantla, Guntur - 522034, Andhra Pradesh
atomsdigitalsolutions@gmail.com | +91 98765 43210`;

const FIXED_WHY_ATOMS = [
    "Specialized exclusively in healthcare digital marketing",
    "Deep understanding of patient psychology and medical content",
    "Proven track record with hospitals and clinics across Andhra Pradesh",
    "Dedicated content team with medical communication expertise",
    "Transparent reporting and consistent communication"
];

const FIXED_PROCESS = [
    "Requirement Discussion — Understanding your goals and target audience",
    "Strategy Planning — Content calendar, themes, and platform strategy",
    "Content Creation — Reels, posters, shoots as per agreed deliverables",
    "Client Approval — Review and approval before publishing",
    "Publishing — Scheduled posting across selected platforms",
    "Performance Review — Monthly insights and recommendations"
];

const FIXED_TIMELINE = [
    "Week 1: Content planning, strategy alignment, and approvals",
    "Week 2: Content creation and video shoot (if applicable)",
    "Week 3: Publishing, optimization, and community engagement",
    "Week 4: Performance tracking, reporting, and next month planning"
];

const FIXED_REPORTING = [
    "Reach and impressions across all platforms",
    "Engagement rate (likes, comments, shares, saves)",
    "Follower growth tracking",
    "Leads and enquiries generated",
    "Best-performing content analysis",
    "Strategic recommendations for the next month"
];

const ProposalRenderer = ({ data, content }) => {
    if (!data || !content) return null;

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div style={{
            background: '#ffffff',
            color: '#1a1a1a',
            fontFamily: 'Arial, sans-serif',
            lineHeight: 1.6,
            padding: '40px',
            maxWidth: '800px',
            margin: 'auto'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ color: '#1e3a8a', fontWeight: 'bold', fontSize: '22px', margin: 0 }}>Atoms Digital Solutions Private Limited</h2>
                <p style={{ margin: 0, fontSize: '14px' }}>CIN: U74999AP2022PTC133342</p>
                <p style={{ margin: 0, fontSize: '14px' }}>Email: atomsdigitalsolutions@gmail.com | Phone: +91 98765 43210</p>
                <h3 style={{ marginTop: '16px', letterSpacing: '1px' }}>DIGITAL MARKETING PROPOSAL</h3>
            </div>

            {/* Client Info Block */}
            <div style={{ marginBottom: '32px' }}>
                <p><strong>Prepared For:</strong> {data.clientName}, {data.city}</p>
                <p><strong>Package:</strong> {data.packageName}</p>
                <p><strong>Date:</strong> {today}</p>
            </div>

            {/* Section Component Helper */}
            {(() => {
                const Section = ({ title, children }) => (
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ 
                            color: '#1e3a8a', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1px', 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            borderBottom: '2px solid #1e3a8a', 
                            paddingBottom: '6px', 
                            marginTop: '32px',
                            marginBottom: '16px'
                        }}>{title}</h4>
                        {children}
                    </div>
                );

                return (
                    <>
                        <Section title="Understanding Your Requirement">
                            <p>{content.understandingRequirement}</p>
                        </Section>

                        <Section title="Objectives of Digital Marketing">
                            <ul style={{ paddingLeft: '20px' }}>
                                {FIXED_OBJECTIVES.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </Section>

                        <Section title="Recommended Service Scope">
                            {content.serviceScope && content.serviceScope.map((service, idx) => (
                                <div key={idx} style={{ marginBottom: '16px' }}>
                                    <strong>{service.serviceName}</strong>
                                    <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
                                        <div style={{ flex: 1 }}>
                                            <em>What We Do:</em>
                                            <ul style={{ paddingLeft: '20px' }}>
                                                {service.whatWeDo.map((item, i) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <em>Expected Results:</em>
                                            <ul style={{ paddingLeft: '20px' }}>
                                                {service.expectedResults.map((item, i) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Section>

                        {data.platforms && data.platforms.length > 0 && (
                            <Section title="Monthly Deliverables">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#1e3a8a', color: 'white' }}>
                                            <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Deliverable</th>
                                            <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Quantity</th>
                                            <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Platform</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Reels / Videos</td>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{data.reels}</td>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{data.platforms.join(', ')}</td>
                                        </tr>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Posters / Statics</td>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{data.posters}</td>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{data.platforms.join(', ')}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Video Shoots</td>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{data.shoots}</td>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Local Clinic/Hospital</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Section>
                        )}

                        <Section title="Content Strategy">
                            <ul style={{ paddingLeft: '20px' }}>
                                {content.contentStrategy && content.contentStrategy.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </Section>

                        <Section title="Our Process">
                            <ol style={{ paddingLeft: '20px' }}>
                                {FIXED_PROCESS.map((item, i) => <li key={i}>{item}</li>)}
                            </ol>
                        </Section>

                        <Section title="Project Timeline">
                            <ul style={{ paddingLeft: '20px', listStyleType: 'none', marginLeft: '-20px' }}>
                                {FIXED_TIMELINE.map((item, i) => <li key={i} style={{ marginBottom: '4px' }}>{item}</li>)}
                            </ul>
                        </Section>

                        <Section title="Pricing Structure">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#1e3a8a', color: 'white' }}>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Item</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{data.packageName} (Base)</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{formatCurrency(data.basePrice)}</td>
                                    </tr>
                                    {data.addOns && data.addOns.map((addon, i) => (
                                        <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Add-On: {addon.name}</td>
                                            <td style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{addon.price ? formatCurrency(addon.price) : 'Custom'}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Subtotal</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(data.subtotal)}</td>
                                    </tr>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>GST (18%)</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{formatCurrency(data.gst)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '10px', border: '1px solid #e5e7eb', fontWeight: 'bold', fontSize: '16px' }}>Total Monthly Investment</td>
                                        <td style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>{formatCurrency(data.totalPrice)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Section>

                        <Section title="Reporting & Analytics">
                            <p style={{ marginBottom: '8px' }}>Monthly performance reports will include:</p>
                            <ul style={{ paddingLeft: '20px' }}>
                                {FIXED_REPORTING.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </Section>

                        <Section title="Important Notes">
                            <ul style={{ paddingLeft: '20px' }}>
                                {FIXED_IMPORTANT_NOTES.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </Section>

                        <Section title="Why Atoms Digital Solutions?">
                            <ul style={{ paddingLeft: '20px' }}>
                                {FIXED_WHY_ATOMS.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </Section>

                        <Section title="Conclusion">
                            <p>{content.conclusion}</p>
                        </Section>
                    </>
                );
            })()}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#666' }}>
                <p style={{ margin: 0 }}>Atoms Digital Solutions Private Limited</p>
                <p style={{ margin: 0 }}>Flat No. 301, Sri Siva Sankari Nilayam, Gorantla, Guntur - 522034, Andhra Pradesh</p>
                <p style={{ margin: 0 }}>atomsdigitalsolutions@gmail.com | +91 98765 43210</p>
            </div>
        </div>
    );
};

export default ProposalRenderer;
