import { useState, useRef, useEffect } from 'react';
import { CountdownBadge } from './CountdownRing';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  posted:     { label: 'Posted', color: 'var(--on-surface-variant)', bg: 'var(--surface-container)', icon: 'upload' },
  offered:    { label: 'Matching…', color: 'var(--tertiary)', bg: 'rgba(0,110,22,0.1)', icon: 'radar' },
  matched:    { label: 'Matched', color: 'var(--primary-dark)', bg: 'rgba(252,128,25,0.12)', icon: 'volunteer_activism' },
  picked_up:  { label: 'Picked Up', color: '#c88000', bg: 'rgba(245,166,35,0.12)', icon: 'two_wheeler' },
  delivered:  { label: 'Delivered ✓', color: 'var(--tertiary)', bg: 'rgba(0,110,22,0.1)', icon: 'check_circle' },
  expired:    { label: 'Expired', color: 'var(--on-surface-variant)', bg: 'var(--surface-container)', icon: 'cancel' },
  escalated:  { label: 'Escalated', color: 'var(--urgent)', bg: 'rgba(226,55,68,0.1)', icon: 'warning' },
};

export function VegDot({ tags = [] }) {
  const isNonVeg = tags.includes('non_veg');
  return (
    <div
      className={isNonVeg ? 'nonveg-dot' : 'veg-dot'}
      title={isNonVeg ? 'Non-vegetarian' : 'Vegetarian'}
    />
  );
}

import { useApp } from '../context/AppContext';

export function DonationCard({ donation, recipients, drivers, onClick }) {
  const navigate = useNavigate();
  const { user } = useApp();
  const status = STATUS_CONFIG[donation.status] ?? STATUS_CONFIG.posted;
  const recipient = donation.matched_recipient_id
    ? recipients?.find(r => r.id === donation.matched_recipient_id)
    : null;
  const driver = donation.driver_id
    ? drivers?.find(d => d.id === donation.driver_id)
    : null;

  const trackPath = user?.role === 'recipient'
    ? `/recipient/track/${donation.id}`
    : `/donor/track/${donation.id}`;

  const handleClick = () => {
    if (onClick) { onClick(donation); return; }
    if (donation.status === 'matched' || donation.status === 'picked_up' || donation.status === 'delivered') {
      navigate(trackPath);
    } else if (donation.status === 'offered' || donation.status === 'escalated') {
      if (user?.role === 'recipient') {
        navigate('/recipient/offers');
      } else {
        navigate(`/donor/match/${donation.id}`);
      }
    }
  };

  return (
    <div
      className="card animate-fade-in-up"
      onClick={handleClick}
      style={{ cursor: 'pointer', transition: 'transform 160ms, box-shadow 160ms' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-elevated)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      role="button"
      tabIndex={0}
      aria-label={`${donation.description} - ${status.label}`}
    >
      <div style={{ display: 'flex', gap: 12, padding: '16px' }}>
        {/* Thumbnail */}
        <div style={{
          width: 88, height: 88, borderRadius: 12, overflow: 'hidden',
          background: 'var(--surface-container)', flexShrink: 0, position: 'relative'
        }}>
          {donation.photo_url
            ? <img src={donation.photo_url} alt={donation.description} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-high)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              </div>
            )
          }
          <div style={{ position: 'absolute', top: 6, left: 6 }}>
            <VegDot tags={donation.dietary_tags} />
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <span style={{
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                background: status.bg, color: status.color,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
                display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>{status.icon}</span>
                {status.label}
              </span>
              <CountdownBadge expiresAt={donation.expires_at} />
            </div>
            <h4 className="text-headline-sm" style={{ margin: '6px 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {donation.description}
            </h4>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 2, fontVariationSettings: "'FILL' 1" }}>group</span>
              Feeds {donation.est_meals || Math.round((donation.qty_kg || 0) * 2)} people
            </p>
          </div>
          {recipient && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--on-surface-variant)', paddingTop: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1" }}>location_on</span>
              <span className="text-body-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--on-surface)' }}>
                {recipient.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      {(donation.status === 'matched' || donation.status === 'offered') && (
        <div style={{
          padding: '8px 16px',
          background: 'var(--surface-container-low)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {driver && (
              <>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--on-primary-fixed)', fontVariationSettings: "'FILL' 1" }}>two_wheeler</span>
                </div>
                <span className="text-label-md" style={{ color: 'var(--on-surface)' }}>
                  {driver.name} arriving in <strong style={{ color: 'var(--primary-dark)' }}>~12 min</strong>
                </span>
              </>
            )}
            {!driver && donation.status === 'offered' && (
              <span className="text-label-md" style={{ color: 'var(--on-surface-variant)' }}>
                Finding nearest recipient…
              </span>
            )}
          </div>
          {donation.status === 'matched' && (
            <button
              className="btn-primary"
              style={{ height: 32, fontSize: 12, padding: '0 12px' }}
              onClick={e => { e.stopPropagation(); navigate(trackPath); }}
            >
              Track Live →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
