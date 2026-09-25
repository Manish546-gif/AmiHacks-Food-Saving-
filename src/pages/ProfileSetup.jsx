import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ROLE_DETAILS = {
  donor: {
    icon: 'storefront',
    eyebrow: 'Donor profile',
    title: 'Tell us about your kitchen',
    description: 'Start with the essentials riders need to coordinate a safe pickup.',
  },
  recipient: {
    icon: 'apartment',
    eyebrow: 'Recipient profile',
    title: 'Tell us about your institution',
    description: 'Share your intake needs so every match starts with the right context.',
  },
  driver: {
    icon: 'two_wheeler',
    eyebrow: 'Rider profile',
    title: 'Set up your rescue profile',
    description: 'Tell the dispatch desk what you carry and how you can help.',
  },
  admin: {
    icon: 'shield_person',
    eyebrow: 'Operations profile',
    title: 'Set up your operations desk',
    description: 'Give your dispatch team the region and role they will manage.',
  },
};

const ROLE_HOME = {
  donor: '/donor',
  recipient: '/recipient',
  driver: '/driver',
  admin: '/admin',
};

const INITIAL_FORM = {
  name: '',
  phone: '',
  address: '',
  business_type: 'restaurant',
  institution_type: 'child_care',
  contact_person: '',
  registration_id: '',
  beneficiary_count: '',
  capacity_kg: '',
  meal_times: '',
  dietary_rules: [],
  language: 'hi',
  has_kitchen: false,
  has_refrigeration: false,
  vehicle: '',
  vehicle_capacity_kg: '',
  has_cooler: false,
  operations_title: '',
  region: '',
};

const DIETARY_OPTIONS = [
  { id: 'veg_only', label: 'Vegetarian only' },
  { id: 'jain', label: 'Jain food' },
  { id: 'soft_food', label: 'Soft food' },
  { id: 'no_spicy', label: 'Low spice' },
];

const inputStyle = {
  width: '100%',
  minHeight: 48,
  padding: '0 13px',
  borderRadius: 12,
  border: '1px solid var(--outline-variant)',
  background: 'var(--surface-container-low)',
  color: 'var(--on-surface)',
  fontFamily: 'var(--font-family)',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 140ms ease, box-shadow 140ms ease',
};

function parseList(value) {
  if (Array.isArray(value)) return value.map(item => String(item));
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

function getInitialForm(user) {
  const saved = user?.onboarding?.profile || {};
  return {
    ...INITIAL_FORM,
    name: saved.name || '',
    phone: saved.phone || user?.phone || '',
    address: saved.address || '',
    business_type: saved.business_type || 'restaurant',
    institution_type: saved.institution_type || 'child_care',
    contact_person: saved.contact_person || '',
    registration_id: saved.registration_id || '',
    beneficiary_count: saved.beneficiary_count ?? '',
    capacity_kg: saved.capacity_kg ?? '',
    meal_times: Array.isArray(saved.meal_times) ? saved.meal_times.join(', ') : saved.meal_times || '',
    dietary_rules: parseList(saved.dietary_rules),
    language: saved.language || 'hi',
    has_kitchen: Boolean(saved.has_kitchen),
    has_refrigeration: Boolean(saved.has_refrigeration),
    vehicle: saved.vehicle || '',
    vehicle_capacity_kg: saved.vehicle_capacity_kg ?? '',
    has_cooler: Boolean(saved.has_cooler),
    operations_title: saved.operations_title || '',
    region: saved.region || '',
  };
}

function Field({ id, label, value, onChange, type = 'text', placeholder, required = false, autoComplete, inputMode, min, maxLength, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} className="text-label-md" style={{ color: 'var(--on-surface-variant)' }}>
        {label}{required && <span aria-hidden="true" style={{ color: 'var(--secondary)', marginLeft: 3 }}>*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        maxLength={maxLength}
        style={inputStyle}
      />
      {hint && <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{hint}</span>}
    </div>
  );
}

function SelectField({ id, label, value, onChange, options, required = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} className="text-label-md" style={{ color: 'var(--on-surface-variant)' }}>
        {label}{required && <span aria-hidden="true" style={{ color: 'var(--secondary)', marginLeft: 3 }}>*</span>}
      </label>
      <select id={id} name={id} value={value} onChange={onChange} required={required} style={{ ...inputStyle, cursor: 'pointer' }}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ id, label, value, onChange, placeholder, required = false, autoComplete, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} className="text-label-md" style={{ color: 'var(--on-surface-variant)' }}>
        {label}{required && <span aria-hidden="true" style={{ color: 'var(--secondary)', marginLeft: 3 }}>*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        rows={3}
        style={{ ...inputStyle, minHeight: 92, padding: '12px 13px', resize: 'vertical', lineHeight: 1.45 }}
      />
      {hint && <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{hint}</span>}
    </div>
  );
}

function ToggleField({ id, label, description, checked, onChange }) {
  return (
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '11px 12px', borderRadius: 12, background: 'var(--surface-container-low)', cursor: 'pointer' }}>
      <span>
        <span className="text-label-md" style={{ display: 'block', fontWeight: 700 }}>{label}</span>
        <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{description}</span>
      </span>
      <input id={id} name={id} type="checkbox" checked={checked} onChange={onChange} style={{ width: 22, height: 22, accentColor: 'var(--tertiary)', flexShrink: 0 }} />
    </label>
  );
}

function SectionTitle({ number, title, description }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', paddingBottom: 2 }}>
      <span style={{ width: 28, height: 28, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-fixed)', color: 'var(--primary-dark)', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{number}</span>
      <span>
        <span className="text-label-lg" style={{ display: 'block', fontWeight: 800 }}>{title}</span>
        <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{description}</span>
      </span>
    </div>
  );
}

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, completeOnboarding, logout } = useApp();
  const [form, setForm] = useState(() => getInitialForm(user));
  const [error, setError] = useState('');
  const role = user?.role || 'donor';
  const details = ROLE_DETAILS[role] || ROLE_DETAILS.donor;
  const isEditing = user?.onboarding?.completed === true;
  const nextLabel = role === 'admin' ? 'Workspace' : 'Verification';

  if (!user) return null;

  const handleChange = (field, event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setError('');
    setForm(previous => ({ ...previous, [field]: value }));
  };

  const toggleDietary = (option) => {
    setError('');
    setForm(previous => {
      const current = parseList(previous.dietary_rules);
      const next = current.includes(option) ? current.filter(item => item !== option) : [...current, option];
      return { ...previous, dietary_rules: next };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const phoneDigits = String(form.phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    const requiredFields = {
      donor: ['name', 'phone', 'address', 'business_type'],
      recipient: ['name', 'phone', 'address', 'institution_type', 'contact_person', 'beneficiary_count', 'capacity_kg', 'meal_times'],
      driver: ['name', 'phone', 'vehicle', 'vehicle_capacity_kg'],
      admin: ['name', 'phone', 'operations_title', 'region'],
    }[role] || [];
    const missingField = requiredFields.find(field => !String(form[field] ?? '').trim());

    if (phoneDigits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (missingField) {
      setError('Complete the required profile fields before continuing.');
      return;
    }
    if (role === 'recipient' && (Number(form.beneficiary_count) < 1 || Number(form.capacity_kg) < 1)) {
      setError('Beneficiary count and storage capacity must be greater than zero.');
      return;
    }
    if (role === 'driver' && Number(form.vehicle_capacity_kg) < 1) {
      setError('Vehicle capacity must be greater than zero.');
      return;
    }

    const profile = {
      name: String(form.name || '').trim(),
      phone: `+91 ${phoneDigits}`,
    };

    if (role === 'donor') {
      Object.assign(profile, {
        business_type: form.business_type,
        address: String(form.address || '').trim(),
      });
    }

    if (role === 'recipient') {
      Object.assign(profile, {
        institution_type: form.institution_type,
        address: String(form.address || '').trim(),
        contact_person: String(form.contact_person || '').trim(),
        registration_id: String(form.registration_id || '').trim(),
        beneficiary_count: Number(form.beneficiary_count),
        capacity_kg: Number(form.capacity_kg),
        meal_times: String(form.meal_times || '').split(',').map(item => item.trim()).filter(Boolean),
        dietary_rules: form.dietary_rules,
        language: form.language,
        has_kitchen: form.has_kitchen,
        has_refrigeration: form.has_refrigeration,
      });
    }

    if (role === 'driver') {
      Object.assign(profile, {
        vehicle: String(form.vehicle || '').trim(),
        vehicle_capacity_kg: Number(form.vehicle_capacity_kg),
        has_cooler: form.has_cooler,
      });
    }

    if (role === 'admin') {
      Object.assign(profile, {
        operations_title: String(form.operations_title || '').trim(),
        region: String(form.region || '').trim(),
      });
    }

    completeOnboarding(profile);
    navigate(role === 'admin' ? ROLE_HOME[role] : '/verification', { replace: true });
  };

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', overflowY: 'auto' }}>
      <header style={{ minHeight: 72, display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', background: 'rgba(251,248,255,0.9)', borderBottom: '1px solid var(--surface-container)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(14px)' }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary-container), #ff9a3d)', color: 'white', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 21, fontVariationSettings: "'FILL' 1" }}>eco</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="text-label-sm" style={{ display: 'block', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Profile first</span>
          <span className="text-headline-sm" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isEditing ? 'Update profile' : 'Complete your profile'}</span>
        </div>
        <span className="text-label-sm" style={{ color: 'var(--primary-dark)', background: 'var(--primary-fixed)', padding: '6px 9px', borderRadius: 999, fontWeight: 800, whiteSpace: 'nowrap' }}>Step 2 of 3</span>
      </header>

      <main style={{ padding: '28px 16px 42px' }}>
        <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <section className="animate-fade-in-up" style={{ display: 'flex', gap: 15, alignItems: 'flex-start' }}>
            <div style={{ width: 58, height: 58, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-fixed)', color: 'var(--primary-dark)', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 30, fontVariationSettings: "'FILL' 1" }}>{details.icon}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <span className="text-label-md" style={{ color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{details.eyebrow}</span>
              <h1 className="text-headline-md" style={{ margin: '4px 0 6px', lineHeight: 1.12 }}>{isEditing ? 'Keep your details current' : details.title}</h1>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0, maxWidth: 560, lineHeight: 1.55 }}>{details.description}</p>
            </div>
          </section>

          <div aria-label="Onboarding progress" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, padding: '12px 14px', borderRadius: 16, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)' }}>
            {[
              { label: 'Role & phone', state: 'done' },
              { label: 'Profile', state: isEditing ? 'done' : 'active' },
              { label: nextLabel, state: isEditing ? 'active' : 'next' },
            ].map((item, index) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <span style={{ width: 24, height: 24, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: item.state === 'done' ? 'var(--tertiary)' : item.state === 'active' ? 'var(--primary)' : 'var(--surface-container-high)', color: item.state === 'next' ? 'var(--on-surface-variant)' : 'white', fontSize: 11, fontWeight: 800 }}>
                  {item.state === 'done' ? <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>check</span> : index + 1}
                </span>
                <span className="text-label-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: item.state === 'next' ? 'var(--on-surface-variant)' : 'var(--on-surface)' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {error && <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 14, background: 'var(--error-container)', color: 'var(--on-error-container)', fontSize: 13, fontWeight: 700 }}><span className="material-symbols-outlined" style={{ fontSize: 19 }}>error</span>{error}</div>}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: 20, borderRadius: 22, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)' }}>
            <SectionTitle number="01" title="Identity & contact" description="These details help the right person reach you." />

            <Field id="profile-name" label={role === 'driver' || role === 'admin' ? 'Full name' : role === 'recipient' ? 'Institution name' : 'Establishment name'} value={form.name} onChange={event => handleChange('name', event)} placeholder={role === 'recipient' ? 'e.g. Asha Nilayam Trust' : 'e.g. Royal Spice Kitchen'} required autoComplete={role === 'driver' || role === 'admin' ? 'name' : 'organization'} />
            <Field id="profile-phone" label="Contact phone" value={form.phone} onChange={event => handleChange('phone', event)} type="tel" placeholder="98765 43210" required autoComplete="tel" inputMode="numeric" maxLength={14} />
            {role !== 'admin' && <TextareaField id="profile-address" label={role === 'driver' ? 'Current service area or base location' : 'Address or pickup landmark'} value={form.address} onChange={event => handleChange('address', event)} placeholder={role === 'driver' ? 'Area you usually cover' : 'Street, landmark, city'} required autoComplete={role === 'driver' ? 'address-level2' : 'street-address'} />}

            {role === 'donor' && (
              <>
                <SectionTitle number="02" title="Food business" description="This helps us route compatible surplus pickups." />
                <SelectField id="profile-business-type" label="Business type" value={form.business_type} onChange={event => handleChange('business_type', event)} required options={[{ value: 'restaurant', label: 'Restaurant' }, { value: 'caterer', label: 'Caterer' }, { value: 'hostel_mess', label: 'Hostel or mess' }, { value: 'grocer', label: 'Grocery or retailer' }, { value: 'hotel', label: 'Hotel or banquet' }]} />
              </>
            )}

            {role === 'recipient' && (
              <>
                <SectionTitle number="02" title="Institution details" description="Give us enough context to match safe, usable surplus." />
                <SelectField id="profile-institution-type" label="Institution type" value={form.institution_type} onChange={event => handleChange('institution_type', event)} required options={[{ value: 'child_care', label: 'Child care home' }, { value: 'old_age_home', label: 'Old age home' }, { value: 'anganwadi', label: 'Anganwadi or nutrition hub' }, { value: 'community_kitchen', label: 'Community kitchen' }, { value: 'ngo', label: 'NGO or food bank' }]} />
                <Field id="profile-contact-person" label="In-charge or contact person" value={form.contact_person} onChange={event => handleChange('contact_person', event)} placeholder="e.g. Priya Sharma" required autoComplete="name" />
                <Field id="profile-registration-id" label="Registration ID" value={form.registration_id} onChange={event => handleChange('registration_id', event)} placeholder="Optional for now" autoComplete="off" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  <Field id="profile-beneficiaries" label="People in care" value={form.beneficiary_count} onChange={event => handleChange('beneficiary_count', event)} type="number" placeholder="65" required min={1} inputMode="numeric" />
                  <Field id="profile-capacity" label="Storage capacity (kg)" value={form.capacity_kg} onChange={event => handleChange('capacity_kg', event)} type="number" placeholder="40" required min={1} inputMode="decimal" />
                </div>
                <Field id="profile-meal-times" label="Meal windows" value={form.meal_times} onChange={event => handleChange('meal_times', event)} placeholder="12:30, 19:30" required hint="Separate each preferred meal time with a comma." />
                <SelectField id="profile-language" label="Preferred language" value={form.language} onChange={event => handleChange('language', event)} required options={[{ value: 'hi', label: 'हिन्दी / Hindi' }, { value: 'en', label: 'English' }, { value: 'both', label: 'Hindi + English' }]} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="text-label-md" style={{ color: 'var(--on-surface-variant)' }}>Dietary requirements</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {DIETARY_OPTIONS.map(option => {
                      const selected = form.dietary_rules.includes(option.id);
                      return <button key={option.id} type="button" onClick={() => toggleDietary(option.id)} aria-pressed={selected} style={{ padding: '8px 11px', borderRadius: 999, border: `1px solid ${selected ? 'var(--tertiary)' : 'var(--outline-variant)'}`, background: selected ? 'rgba(0,110,22,0.1)' : 'var(--surface-container-lowest)', color: selected ? 'var(--tertiary)' : 'var(--on-surface-variant)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{selected ? '✓ ' : '+ '}{option.label}</button>;
                    })}
                  </div>
                </div>
                <ToggleField id="profile-kitchen" label="Kitchen or heating setup" description="Can meals be safely received or reheated on site?" checked={form.has_kitchen} onChange={event => handleChange('has_kitchen', event)} />
                <ToggleField id="profile-refrigeration" label="Refrigeration available" description="Cold-chain items can be stored safely." checked={form.has_refrigeration} onChange={event => handleChange('has_refrigeration', event)} />
              </>
            )}

            {role === 'driver' && (
              <>
                <SectionTitle number="02" title="Vehicle & capacity" description="Set a realistic payload limit for safe dispatch planning." />
                <Field id="profile-vehicle" label="Vehicle description or registration" value={form.vehicle} onChange={event => handleChange('vehicle', event)} placeholder="e.g. Honda Activa (RJ-20-AA-1234)" required autoComplete="off" />
                <Field id="profile-vehicle-capacity" label="Max food payload (kg)" value={form.vehicle_capacity_kg} onChange={event => handleChange('vehicle_capacity_kg', event)} type="number" placeholder="50" required min={1} inputMode="decimal" />
                <ToggleField id="profile-cooler" label="Cooler box or thermal bag" description="You can carry cold-chain items safely." checked={form.has_cooler} onChange={event => handleChange('has_cooler', event)} />
              </>
            )}

            {role === 'admin' && (
              <>
                <SectionTitle number="02" title="Operations scope" description="This helps route incoming cases to the right desk." />
                <Field id="profile-operations-title" label="Operations title" value={form.operations_title} onChange={event => handleChange('operations_title', event)} placeholder="e.g. District Dispatch Lead" required autoComplete="organization-title" />
                <Field id="profile-region" label="Region or hub" value={form.region} onChange={event => handleChange('region', event)} placeholder="e.g. Kota Central Hub" required autoComplete="address-level2" />
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                <span>{isEditing ? 'Save profile' : 'Save & continue'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              </button>
              <button type="button" onClick={handleSignOut} style={{ border: 'none', background: 'transparent', color: 'var(--on-surface-variant)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px' }}>Sign out and start over</button>
            </div>
          </form>

          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            {role === 'admin' ? 'Next, you will enter your operations desk.' : 'Next, we will take you through your role-specific verification desk.'}
          </p>
        </div>
      </main>
    </div>
  );
}
